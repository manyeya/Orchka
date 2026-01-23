# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Orchka** (project name "orchka", repo "flowbase") is a workflow automation platform with a visual node-based editor. Users build workflows by connecting nodes on a canvas, and the system executes them using BullMQ job queues with Redis for real-time updates.

## Development Commands

```bash
# Primary development
bun run dev              # Start Next.js dev server with Turbopack
bun run dev:all         # Start all services (dev server + BullMQ worker) via mproc
bun run build           # Build for production
bun run start           # Start production server
bun run lint            # Run ESLint

# Database (Prisma)
bun run prisma migrate dev  # Create and run migrations
bun run prisma generate    # Generate Prisma client
bun run prisma studio      # Open Prisma Studio (DB GUI)

# BullMQ Worker
bun run bullmq         # Start BullMQ worker for workflow execution
# Or directly:
bun bullmq/index.ts

# Documentation site (separate Nextra site in docs-site/)
bun run docs:dev        # Start docs site dev server
bun run docs:build      # Build docs site
```

## Architecture

### Workflow Execution Flow

```
User triggers workflow → workflowQueue → executeWorkflowJob
                                    ↓
                          Create execution record
                          Sort nodes topologically
                          Queue first node → nodeQueue
                                    ↓
                          executeNodeJob (for each node)
                                    ↓
                          Resolve expressions (JSONata)
                          Execute node via executor
                          Publish event to Redis (real-time)
                          Chain to next node (dependency-based)
                                    ↓
                          All nodes complete → execution marked COMPLETED
```

### Key: Branch Sequential Execution

Workflows execute branches one at a time (like n8n), not true parallelism. For a graph like:

```
    3
   /
1
   \
    2 → 4
```

Execution order: `1 → 2 → 4 → 3` (complete first branch before second)

This is handled by dependency tracking in `chainToNextNode()` - nodes execute when all their dependencies are satisfied, prioritizing depth-first within a branch.

### BullMQ Architecture

**Three queues:**
- `workflows` - Workflow orchestration jobs
- `nodes` - Individual node execution jobs
- `webhooks` - Webhook trigger handling

**Key files:**
- `bullmq/setup.ts` - Queue initialization
- `bullmq/orchestrator.ts` - Main execution logic (workflow + node jobs)
- `bullmq/publisher.ts` - Redis pub/sub for real-time UI updates
- `bullmq/index.ts` - Worker entry point

### Database Optimization (Important!)

Execution steps are NOT written to DB during execution. Instead:
1. Steps are published to Redis for real-time UI
2. Steps are persisted to DB only when workflow **completes or fails** (via `persistExecutionSteps()`)
3. When viewing history, if DB is empty, steps are lazy-loaded from Redis

This reduces DB calls from ~4N to just 3 per workflow.

### Node System

All nodes implement the `NodeExecutor` interface:

```typescript
type NodeExecutor<TData> = (params: {
  data: TData;
  nodeId: string;
  context: WorkflowContext;
  expressionContext: ExpressionContext;
  publish: PublishFn;
  resolveCredential?: CredentialResolver;
}) => Promise<WorkflowContext>;
```

**To add a new node type:**
1. Create executor in `features/nodes/{category}/{node-name}/executor.ts`
2. Add to `NodeType` enum in `features/nodes/types.ts`
3. Register in `features/nodes/utils/execution/executors-registry.ts`
4. Add node config in `config/node-components.ts`

**Node categories:**
- **Triggers**: MANUAL_TRIGGER, CRON_TRIGGER
- **Actions**: HTTP_REQUEST
- **AI**: AI_AGENT, AI_GENERATE, AI_EXTRACT, AI_CLASSIFY, AI_AGENT_EXP
- **Control**: IF_CONDITION, SWITCH, LOOP, WAIT
- **Visual**: GROUP, ANNOTATION (no execution, skip during runtime)

### Expression Engine (JSONata)

Node data uses JSONata expressions wrapped in `{{ }}`:

```typescript
// In node configuration
url: "{{ $node('API Base').url }}/users"
apiKey: "{{ json.apiKey }}"

// Available variables in expressions
$input           // Current node's input
$node("Name")    // Get output from another node
$workflow.id     // Workflow metadata
$execution.id    // Execution metadata
$env.API_KEY     // Environment variables
$now             // Current timestamp
$today           // Today's date
$branch.last     // Last control node decision
```

**Files:**
- `features/editor/utils/expression-engine/index.ts` - Core engine with JSONata
- `features/editor/utils/resolve-expressions.ts` - Recursive expression resolution

### Credential Management

Credentials are encrypted at rest with AES-256-GCM. The master key comes from `CREDENTIAL_ENCRYPTION_KEY` env var (64 hex chars).

**Files:**
- `lib/credentials/execution.ts` - Runtime decryption for executors
- `features/credentials/server/router.ts` - CRUD API with encryption

**Usage in executors:**
```typescript
if (data.credentialId && resolveCredential) {
  const credential = await resolveCredential(data.credentialId);
  // Use credential.data.authToken, etc.
}
```

### Authentication (Better Auth)

Using `@polar-sh/better-auth` with Polar integration for subscriptions.

**Auth configuration:**
- `lib/auth/` - Better Auth setup
- `app/api/auth/[...all]/route.ts` - Auth API routes
- Social providers: GitHub, Google

### Prisma Schema

Key models:
- `Workflow` - Workflow definitions
- `Node` - Workflow nodes (linked to Workflow)
- `Connection` - Edges between nodes (fromNodeId, toNodeId, fromOutput, toInput)
- `Execution` - Workflow execution records
- `ExecutionStep` - Step history (lazy persisted from Redis)
- `Credential` - Encrypted credentials per user

### Control Node Behavior

**IF/SWITCH nodes:**
- Return `{ __branchDecision: { branch: "true" | "false" | "case-N" } }`
- Non-taken branches are skipped via `getSkippedNodes()`
- Branch decisions tracked in `branchDecisions` map

**LOOP nodes:**
- Return `{ __loopNode: { nodeId, items: [..], total, mode } }`
- Loop body executed inline in `executeLoopBody()`
- Uses `$item`, `$index`, `$total` in expressions

**WAIT nodes:**
- Use BullMQ delayed jobs (not `sleep()`)
- Return delay in ms; next job queued with `jobOptions.delay`

### Environment Variables

Required in `.env.local`:
```
DATABASE_URL=postgresql://...
CREDENTIAL_ENCRYPTION_KEY=$(openssl rand -hex 32)  # 64 hex chars
AUTH_SECRET=random-string-here
BETTER_AUTH_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379

# Optional AI keys (can also be stored as credentials)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
GROQ_API_KEY=
```

## File Structure Notes

```
app/                      # Next.js app directory
├── (auth)/               # Auth pages (login, register)
├── (dashboard)/          # Dashboard and workflow list
├── (editor)/             # Workflow editor with React Flow canvas
features/                 # Feature-based organization
├── auth/                 # Authentication forms
├── credentials/          # Credential CRUD and encryption
├── editor/               # Canvas, nodes palette, expression logic
├── executions/           # Execution history and monitoring
├── nodes/                # Node types and executors
└── workflows/            # Workflow management
bullmq/                   # Job processing
├── orchestrator.ts       # Main execution logic (KEY FILE)
├── publisher.ts          # Redis events for real-time UI
├── setup.ts              # Queue configuration
└── types.ts              # Shared types for executors
lib/                      # Utilities and shared code
├── db.ts                 # Prisma client
├── credentials/          # Credential encryption/decryption
└── errors/               # Custom error classes
```

## Common Patterns

### Adding a New Node Type

1. Create directory: `features/nodes/{category}/{node-name}/`
2. Create `executor.ts` with `NodeExecutor` function
3. Add to `NodeType` enum in `features/nodes/types.ts`
4. Register in `executors-registry.ts`
5. Add config in `config/node-components.ts`

### Accessing Node Data in Expressions

```typescript
// In executor
const result = await executor({
  data: resolvedData,
  context,  // Contains results from previous nodes: { 'Node Name': { ... } }
  expressionContext,
  // ...
});

// Users access via:
{{ $node('Node Name').someField }}
```

### Publishing Real-time Updates

```typescript
// In executor
await publish({
  nodeId,
  nodeType: NodeType.HTTP_REQUEST,
  type: 'node-status',
  status: 'loading' | 'success' | 'error',
  input: filteredData,
  output: result,
});
```

## Important Constraints

1. **No DB writes during node execution** - Use Redis publisher for real-time, `persistExecutionSteps()` only on completion/failure
2. **Control nodes must return branch decisions** - `{ __branchDecision: { branch: "...", data: ... } }`
3. **Expressions use JSONata syntax** - Not JavaScript, test expressions in `features/editor/utils/expression-engine/`
4. **Credential encryption key is required** - Generate with `openssl rand -hex 32`
5. **Branch sequential execution** - Nodes execute one at a time, prioritizing depth-first within branches

## Testing

Tests use Vitest. Run tests with:
```bash
bun test              # Run all tests (if configured)
```

Test configuration in `vitest.config.ts` with path aliases for `@` imports.
