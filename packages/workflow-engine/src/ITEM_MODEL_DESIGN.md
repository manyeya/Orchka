# Design: Per-Item Execution Model (n8n-style fan-out)

> **Status: DESIGN ONLY — not implemented.** This document specifies the
> deepest change toward n8n fidelity and a migration path that keeps the engine
> shippable throughout. Revisit only after the Phase 1 durability work and the
> Phase 2 parallel path have had production soak time. See `ROADMAP.md` and
> `../../../.claude/plans/ticklish-splashing-garden.md`.

## 1. The gap

Today Orchka uses a **flat, single-object context**: each node produces one
output object, and the accumulated state is a bag keyed by node name.

```ts
// packages/workflow-engine/src/types.ts
export type WorkflowContext = Record<string, unknown>; // { [nodeName]: output }

// every executor, e.g. packages/nodes/src/nodes/action/https-request/executor.ts
return { ...context, [nodeName]: { status, data, headers } };
```

n8n's defining feature is the opposite: data flows as an **array of items**, and
every node **maps over the items** automatically.

```ts
type Item = { json: Record<string, unknown>; binary?: Record<string, Buffer> };
type NodeOutput = Item[]; // an HTTP node hit once per input item, etc.
```

Consequences of not having it:
- No automatic per-item fan-out. To process a list you must use the explicit
  `LOOP` node; in n8n iteration is implicit.
- Expressions can't address "the current item" (`$json`) uniformly — they reach
  into a named node's single object via `$node('Name').field`.
- "Split → process each → aggregate" pipelines are awkward.

## 2. Target model

### 2.1 Data shape

```ts
export interface Item {
  json: Record<string, unknown>;
  binary?: Record<string, { data: Buffer; mimeType: string; fileName?: string }>;
  /** index of the source item this was derived from, for paired-item lookups */
  pairedItem?: number;
}

/** A node's output is a list of items (one "row" each). */
export type NodeItems = Item[];

/** Context becomes node-name -> that node's emitted items. */
export type WorkflowContext = Record<string, NodeItems>;
```

### 2.2 Executor contract (versioned)

Introduce a v2 executor that receives and returns item arrays, while keeping the
existing v1 signature working via a shim (see §4).

```ts
// new: packages/nodes/src/nodes/utils/execution/types-v2.ts
export interface NodeExecutorV2Params<TData> {
  /** input items for this node (already resolved per the upstream edges) */
  items: Item[];
  data: TData;                    // node config (may contain expressions)
  nodeId: string;
  context: WorkflowContext;       // full item-keyed bag, for $node() lookups
  /** resolve `data` expressions for a specific item index */
  resolveForItem: (data: TData, itemIndex: number) => Promise<TData>;
  publish: PublishFn;
  resolveCredential?: CredentialResolver;
}

export type NodeExecutorV2<TData = Record<string, unknown>> =
  (p: NodeExecutorV2Params<TData>) => Promise<Item[]>;
```

Most action nodes become a `map` over `items`:

```ts
export const httpsRequestExecutorV2: NodeExecutorV2 = async ({ items, data, resolveForItem }) => {
  return Promise.all(items.map(async (item, i) => {
    const resolved = await resolveForItem(data, i); // {{$json.x}} -> item.json.x
    const res = await ky(resolved.url, ...);
    return { json: { status: res.status, data: await res.json() }, pairedItem: i };
  }));
};
```

### 2.3 Expressions

Extend `packages/expression-engine/src/index.ts`:
- Add `$json` (current item's `json`) and `$item` (current item) bound per item
  index during `resolveForItem`. Today `nodeDataByName` (≈ line 409) and the
  `$node` function (≈ line 449) map a name to a single object; they become a map
  to `Item[]`, with `$node('Name').item(i)` / `$node('Name').first()` helpers.
- `$items('Name')` returns the full array; `$node('Name').json` keeps working by
  resolving against the **paired item** (n8n semantics) for the common 1:1 case.

### 2.4 Control nodes under items

- `IF` / `SWITCH`: route **per item** — items can split across branches (n8n
  emits one output array per branch). This subsumes much of what `LOOP` does.
- `LOOP`: becomes largely redundant for "iterate a list" (that's now implicit).
  Keep it for explicit batching (`SplitInBatches`-style) and bounded retries.
- `MERGE`: gains real semantics — append / by-index / by-key joins of item
  arrays — instead of just a fan-in barrier.

## 3. Engine impact

The engine already threads outputs through `WorkflowContext`; widening that to
`Record<string, Item[]>` is mostly mechanical at the orchestrator layer:
- `executeNodeJob`: build `items` for a node from its **incoming edges'** source
  node items (concatenate, or pair by branch), call the v2 executor, store the
  returned `Item[]` in context/shared-state instead of a single object.
- `execution-state.ts` (Phase 2): the context hash value per node name becomes a
  JSON `Item[]` — no structural change to the keys, just the payload type.
- `plan-next-nodes.ts`: unaffected (scheduling is item-agnostic).

Per-item fan-out does **not** require per-item BullMQ jobs: a node maps over its
items in one job. (Per-item jobs would be a later scaling option for huge
batches, orthogonal to this design.)

## 4. Migration strategy (keep it shippable)

The risk is the ~25 executors + expression engine changing at once. Avoid a big
bang:

1. **Dual interface.** Add `NodeExecutorV2` alongside the current `NodeExecutor`.
   The registry (`executors-registry.ts`) holds either; a node declares its
   version.

2. **Auto-shim v1 → v2.** Wrap any remaining v1 executor so the engine only ever
   calls a v2 surface:
   ```ts
   const asV2 = (v1: NodeExecutor): NodeExecutorV2 => async ({ items, data, context, ... }) => {
     // v1 saw a single object; feed it the first item's json merged into context
     const out = await v1({ data, context: flattenItems(context), ... });
     return [{ json: out[nodeName] ?? out }]; // single-item output
   };
   ```
   This lets v1 and v2 nodes coexist in the same workflow during migration.

3. **Workflow-level opt-in flag.** A `Workflow.executionModel: 'object' | 'items'`
   column (default `'object'`). Only `'items'` workflows use item semantics in
   expressions; `'object'` workflows keep today's behavior exactly. New workflows
   can default to `'items'` once the core nodes are migrated.

4. **Migrate nodes incrementally**, highest-value first: HTTP_REQUEST, the AI
   nodes, IF/SWITCH, MERGE. Each migration is isolated and testable (golden tests
   comparing v1-shim output vs native v2 for the 1:1 case).

5. **Expression engine** gains `$json`/`$item`/`$items` behind the same flag so
   `'object'` workflows are unaffected.

6. **Deprecate the shim** only once all bundled nodes are v2 and `'items'` is the
   default; `'object'` mode remains for old saved workflows.

## 5. Decision checkpoint before building

- Confirm appetite for changing the saved-workflow data contract (the flag keeps
  old workflows safe, but `'items'` workflows serialize differently).
- Decide whether `LOOP` stays as `SplitInBatches` or is removed.
- Settle paired-item semantics for `$node('Name').field` (n8n's rules are subtle
  around multi-item upstreams).

**Recommendation:** build only after Phases 1–2 are proven in production, and do
it node-by-node behind the workflow flag — never as one breaking change.
