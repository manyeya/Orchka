# Roadmap

## Future Improvements

### Execution Reliability

#### 1. Redis Persistence (AOF) 🔴 High Priority

**Problem:** Redis is in-memory by default. If Redis crashes/restarts, all execution history in Redis is lost.

**Solution:** Enable AOF (Append Only File) persistence.

```bash
# Add to redis.conf
appendonly yes
appendfsync everysec
```

**Files to modify:**
- Redis configuration
- Deployment/docker-compose files

**Estimated effort:** 30 minutes

---

#### 2. Dead Letter Queue (DLQ) 🟡 Medium Priority

**Problem:** Jobs that fail all retry attempts are lost. No visibility into what failed or ability to retry manually.

**Solution:** Configure BullMQ Dead Letter Queue for failed jobs.

**Benefits:**
- View failed executions in one place
- Manual retry mechanism
- Pattern analysis (e.g., "API X keeps failing")

**Implementation:**
```typescript
// In bullmq/setup.ts
import { Queue } from 'bullmq';

export const deadLetterQueue = new Queue('executions-dlq', {
  connection: redis,
});

export const nodeQueue = new Queue('nodes', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});
```

**Files to modify:**
- `bullmq/setup.ts`
- `features/executions/server/router.ts` (add DLQ list endpoint)

**Estimated effort:** 2-3 hours

---

#### 3. Periodic Checkpoints 🟢 Low Priority

**Problem:** If worker crashes mid-execution, only completed steps are preserved. Long-running workflows could lose significant progress.

**Solution:** Persist steps to DB every N nodes during execution.

**When to implement:** Only if users run workflows with 50+ nodes regularly.

**Implementation sketch:**
```typescript
// In orchestrator.ts
let nodesSinceLastPersist = 0;
const CHECKPOINT_INTERVAL = 5;

async function chainToNextNode(...) {
  // ... execute node ...

  nodesSinceLastPersist++;
  if (nodesSinceLastPersist >= CHECKPOINT_INTERVAL) {
    await persistExecutionSteps(executionId, workflowId);
    nodesSinceLastPersist = 0;
  }
}
```

**Files to modify:**
- `bullmq/orchestrator.ts`

**Estimated effort:** 1 hour

---

### Performance

#### 4. Parallel Execution with FlowProducer 🟡 Medium Priority

**Current:** Sequential execution (one node at a time)

**Goal:** True parallel execution of independent branches

```
Current:    1 → 2 → 4 → 3
Desired:    1 → (2, 3 in parallel) → 4
```

**Solution:** Use BullMQ's FlowProducer for managing parallel workflows.

**Files to modify:**
- `bullmq/orchestrator.ts` (major refactor)

**Estimated effort:** 6-8 hours

---

#### 5. Workflow Result Caching 🟢 Low Priority

**Problem:** Re-executing identical workflows with same inputs wastes resources.

**Solution:** Cache results by (workflowId + inputHash).

**Files to create:**
- `lib/workflow-cache.ts`

**Estimated effort:** 3 hours

---

### Observability

#### 6. Execution Metrics Dashboard 🟢 Low Priority

**Features:**
- Average execution time per workflow
- Success/failure rate
- Node-level performance metrics
- Resource usage tracking

**Files to create:**
- `features/analytics/`
- `app/(dashboard)/analytics/`

**Estimated effort:** 8 hours

---

#### 7. Webhook Retry Logs 🟢 Low Priority

**Problem:** When webhook triggers fail, no retry history is visible.

**Solution:** Store retry attempts with timestamps and error messages.

**Files to modify:**
- `bullmq/webhook-worker.ts`

**Estimated effort:** 2 hours

---

## Prioritized Implementation Order

1. **Redis AOF** - Do this first, essential for data safety
2. **Dead Letter Queue** - Important for production debugging
3. **Periodic Checkpoints** - Only if running long workflows
4. **Parallel Execution** - Performance improvement
5. **Caching** - Performance improvement
6. **Metrics Dashboard** - Nice to have
7. **Webhook Logs** - Nice to have

---

## Legend

| Priority | Meaning |
|----------|---------|
| 🔴 High | Critical for production reliability |
| 🟡 Medium | Important improvement |
| 🟢 Low | Nice to have, can defer |
