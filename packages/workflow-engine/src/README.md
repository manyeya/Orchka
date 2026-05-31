# Orchka Workflow Engine (`@orchka/workflow-engine`)

The execution engine that runs Orchka workflows on **BullMQ + Redis**. It
replaced an earlier Inngest implementation; a few field names (`inngestRunId`)
remain as harmless vestiges.

> **Audience:** contributors working on execution, reliability, or scheduling.
> For the user-facing version of this material see
> [`/docs/execution-reliability`](../../../apps/docs-site/content/docs/execution-reliability.mdx).

---

## 1. Execution model

The engine uses a **node-per-job** model (closer to Make/Inngest than to n8n):

```
trigger ──► workflowQueue ──► executeWorkflowJob
                                   │  create execution record
                                   │  topologically sort nodes
                                   │  build dependency map
                                   ▼
                              nodeQueue ──► executeNodeJob   ◄─┐
                                   │  resolve {{expressions}}   │
                                   │  run executor             │ chains the
                                   │  publish event to Redis    │ next node(s)
                                   │  chainToNextNode ─────────┘
                                   ▼
                        all nodes done ──► finalize (COMPLETED)
```

- `executeWorkflowJob` enqueues only the **first** node.
- Each `executeNodeJob` runs one node and then chains its successor(s).
- Workflow state — accumulated context (keyed by node **name**), the dependency
  map, the completed/skipped sets, and branch decisions — is threaded through
  each job's payload (`NodeJobData`) in the **sequential** path, or held in
  shared Redis state in the **parallel** path (see §4).

### Sequential vs. parallel

| | Sequential (default) | Parallel (`ORCHKA_PARALLEL_BRANCHES=1`) |
| --- | --- | --- |
| Ready nodes | Picks **one** (`readyNodes[0]`), depth-first | Enqueues **all** ready nodes |
| State | Threaded through job payload | Authoritative in Redis (`execution-state.ts`) |
| Fan-in | Works for linear/diamond via dependency tracking | Merge sees every branch's output from shared state |
| Default | On | Off |

### Control nodes

- **IF / SWITCH** — return `{ __branchDecision: { branch } }`; non-taken
  branches are computed via `getSkippedNodes` (transitive reachability) and added
  to the skipped set.
- **LOOP** — returns `{ __loopNode: {...} }`; the body runs **in-process** inside
  `executeLoopBody` (one synchronous pass per item). `$item / $index / $total`
  are injected into the iteration context.
- **WAIT** — returns a delay; the next job is enqueued with `jobOptions.delay`
  (BullMQ delayed job), and `previousWaitNodeId` marks the WAIT as succeeded when
  the delayed job starts. *(Inside a loop, WAIT currently blocks with
  `setTimeout` — see §6.)*

---

## 2. Reliability

### Per-node retry classification — `@orchka/nodes/runtime` `retry-policy.ts`

Retries are applied **per node type** at enqueue time, not globally:

- **Idempotent** → `attempts: 3`, exponential backoff (AI nodes, control nodes,
  triggers, HTTP `GET`/`HEAD`).
- **Side-effecting** → `attempts: 1` (every social-post node, HTTP
  `POST`/`PUT`/`PATCH`/`DELETE`). Retrying these would duplicate the side effect,
  so they fail straight to the DLQ.

`getRetryPolicy(type, data)` returns the BullMQ options; `HTTP_REQUEST` inspects
`data.method`. `UnrecoverableError` (missing credential, missing workflow) skips
retries entirely for fail-fast errors.

### Dead-letter queue — `setup.ts`, `dead-letter.ts`, `workers.ts`

The node worker's `failed` handler calls `isTerminalFailure(job)` and, when
retries are exhausted (or the node never retries), `moveToDeadLetter(job, error)`
parks the full `NodeJobData` + error in the `dead-letter` queue. Queues use
`removeOnFail: { count: 1000 }` (retain recent failures) instead of deleting.
`requeueFromDeadLetter(dlqJobId)` re-enqueues a parked job onto `nodeQueue`
unchanged.

### Step persistence & checkpoints — `orchestrator.ts`, `publisher.ts`

- During a run, steps are **published to Redis only** (no per-step DB write). The
  publisher keeps a per-execution history list capped at `MAX_HISTORY_EVENTS`
  (**10,000**, was 100 — long runs no longer lose their middle).
- `persistExecutionSteps` flushes Redis → Postgres (`createMany`, deterministic
  ids, `skipDuplicates`) on completion/failure **and** every `CHECKPOINT_EVERY_N`
  (**25**) nodes / loop iterations. Idempotent, so safe to call repeatedly.

### Redis durability — `docker-compose.yml` (repo root)

Redis runs with `--appendonly yes --appendfsync everysec` and a named volume, so
in-flight jobs and step history survive a restart (≤ ~1s loss). **Self-hosted
Redis must enable AOF too.**

---

## 3. Files

| File | Responsibility |
| --- | --- |
| `setup.ts` | Queues (`workflows`, `nodes`, `webhooks`, `dead-letter`), `FlowProducer`, `QueueEvents`, Redis connection |
| `orchestrator.ts` | `executeWorkflowJob`, `executeNodeJob`, `chainToNextNode` (sequential), `chainToNextNodeParallel` (parallel), `executeLoopBody`, `persistExecutionSteps`, WAIT handling |
| `execution-state.ts` | **Parallel path:** authoritative per-execution Redis state + `isParallelExecutionEnabled()` |
| `plan-next-nodes.ts` | Pure scheduler: `computeReadyNodes`, `isWorkflowComplete` (unit-tested) |
| `dead-letter.ts` | `moveToDeadLetter`, `requeueFromDeadLetter`, `isTerminalFailure` |
| `publisher.ts` | Redis pub/sub for real-time UI + history list (`MAX_HISTORY_EVENTS`) |
| `workers.ts` | Workflow + node workers, failed→DLQ wiring |
| `types.ts` | `WorkflowContext`, `NodeExecutor`, `BranchDecision`, etc. |

---

## 4. Parallel execution internals (`execution-state.ts` + `plan-next-nodes.ts`)

Threading state through job payloads breaks under concurrency: two branches
running at once carry **divergent copies** and lose each other's updates at a
fan-in. The parallel path moves state to Redis:

- **Keys** per execution: `exec:{id}:context` (hash, node name → JSON output),
  `:completed` / `:skipped` (sets), `:branch` (hash), `:enqueued` (claim set),
  `:finalized` (guard). 24h TTL safety net.
- **Fan-in correctness without Lua:** `commitNode` writes a node's output to the
  context hash **before** adding it to `completed`. Redis serializes commands, so
  any job that sees a node as completed also sees its output. The last branch to
  finish always observes every completion (it read after everyone else's `SADD`),
  so completion detection and joins never miss a node.
- **No double-enqueue:** `claimNode` is an atomic `SADD` → exactly one of several
  concurrent parents wins the right to enqueue a shared child.
- **Finalize once:** `tryFinalize` is `SET NX` → one branch finalizes when
  `isWorkflowComplete` (every node completed or skipped) holds.

`plan-next-nodes.ts` is pure (no Redis) and unit-tested for fan-out, diamonds,
IF-skip joins (a skipped parent counts as satisfied so re-convergence works), and
cascade-skips.

---

## 5. Configuration

```env
# Connection (either form)
REDIS_URL=redis://localhost:6379
# or REDIS_HOST / REDIS_PORT / REDIS_PASSWORD

# Opt-in parallel branch execution (default: off). Set for the WORKER process.
ORCHKA_PARALLEL_BRANCHES=1
```

The worker loads env from `apps/web/.env.local` (see the `start` script). Run the
durable Redis with `docker compose up -d redis`, then the worker with
`bun run worker` (or `bun run dev:all` for app + worker).

---

## 6. Roadmap & design

- **`ROADMAP.md`** — status of reliability/performance work. Landed: AOF, DLQ,
  checkpoints, per-node retries, parallel branches. **Remaining:** loop body as
  queued jobs (makes loops + in-loop WAIT crash-recoverable).
- **`ITEM_MODEL_DESIGN.md`** — design-only spec for an n8n-style per-item
  (`Array<{ json }>`) execution model and its incremental migration path.

---

## 7. Testing

Pure logic is unit-tested with Vitest (no Redis/BullMQ required):

```bash
bunx vitest run packages/workflow-engine packages/nodes
```

- `plan-next-nodes.test.ts` — readiness / completion / diamond / skip logic.
- `execution-state.test.ts` — claim dedup, fan-in visibility invariant,
  finalize-once, using an in-memory Redis fake.
- `retry-policy.test.ts` (in `@orchka/nodes`) — idempotent vs. side-effecting
  classification, HTTP-by-method.

End-to-end execution (parallel path, crash-resume) requires a live
Redis + Postgres + worker; see the verification steps in
`/docs/execution-reliability` and `ROADMAP.md`.
