# Roadmap

## Future Improvements

### Execution Reliability

#### 1. Redis Persistence (AOF) ✅ DONE

**Problem:** Redis is in-memory by default. If Redis crashes/restarts, all execution history in Redis is lost.

**Solution:** Enabled AOF (Append Only File) persistence via the root `docker-compose.yml`
Redis service: `redis-server --appendonly yes --appendfsync everysec`, backed by the
`orchka-redis-data` named volume.

**Landed in:** `docker-compose.yml` (repo root).

---

#### 2. Dead Letter Queue (DLQ) ✅ DONE

**Problem:** Jobs that fail all retry attempts are lost. No visibility into what failed or ability to retry manually.

**Solution:** Added a `dead-letter` BullMQ queue. The node worker's `failed` handler
routes terminally-failed jobs (retries exhausted, or side-effecting nodes that never
retry) into it with the full `NodeJobData` payload + error, so they can be inspected and
re-queued. Pairs with per-node retry classification (`retry-policy.ts`): idempotent nodes
retry 3× with backoff; side-effecting nodes (social posts, non-GET HTTP) run once and DLQ
on failure. Queues also switched from `removeOnFail: true` → `{ count: 1000 }`.

**Landed in:** `setup.ts` (`deadLetterQueue`), `dead-letter.ts` (`moveToDeadLetter`,
`requeueFromDeadLetter`, `isTerminalFailure`), `workers.ts` (failed handler),
`@orchka/nodes/runtime` `retry-policy.ts`. Remaining: a DLQ list/retry endpoint in
`features/executions/server/router.ts` (UI surface).

<details><summary>Original sketch</summary>

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

</details>

---

#### 3. Periodic Checkpoints ✅ DONE

**Problem:** If worker crashes mid-execution, only completed steps are preserved. Long-running workflows could lose significant progress.

**Solution:** `persistExecutionSteps` is now also called every `CHECKPOINT_EVERY_N`
(=25) completed nodes in `chainToNextNode`, and every 25 iterations in the loop body —
not just on completion/failure. Safe because persistence is idempotent (deterministic
step ids + `skipDuplicates`).

**Landed in:** `orchestrator.ts` (`CHECKPOINT_EVERY_N`).

<details><summary>Original sketch</summary>

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

</details>

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

#### 8. Time-Series Storage Rewrite 🟡 Medium Priority

**Problem:** `execution` is a row-per-run OLTP table but every analytical query
(stats cards, charts, by-window filters) treats it as time-series. At low
volume Postgres copes; past a few million rows we hit predictable cliffs:

- Aggregation cost grows linearly with table size even with the new indexes,
  because window queries still touch every row in the window.
- `result Json?` lives in the hot row — large payloads bloat the table that
  the rollup increment, the list query, and the stats backfill all scan.
- Step events in Redis use `LRANGE` over a list capped at 100, silently
  truncating long workflows before `persistExecutionSteps` can persist them.
- There's no retention policy: rows live forever, indexes grow without bound.

**Current state (already landed):**
- Composite indexes on `execution(userId, startedAt)` and
  `execution(userId, status, startedAt)`.
- `ExecutionStat` daily rollup, incremented from the orchestrator on
  finalization, backfilled from history. Stats cards read from the rollup.

**Next milestones, in order:**

1. **Move large payloads off the hot row.** New `execution_payload(executionId,
   result, error)` side table populated from the orchestrator on finalization;
   drop `result Json?` from `execution`. List query stops paying for blob
   width; stats backfill speeds up.

2. **Switch Redis step events to Streams.** Replace
   `LPUSH workflow:{wf}:execution:{ex}:history` + `LRANGE 0..100` with
   `XADD ... MAXLEN ~ N`. Streams give server-assigned IDs, server timestamps,
   bounded length without truncation surprises, and consumer groups for
   future replay/migration work. `persistExecutionSteps` becomes an
   `XRANGE` walk; ordering is guaranteed.

3. **Retention + partitioning.** Native Postgres declarative partitioning on
   `execution` by month, with a nightly `DROP PARTITION` job for partitions
   older than the workspace's retention policy. `ExecutionStat` retains
   forever (cheap, already rolled up). Add `retentionDays` to a workspace
   settings table; default 90 for free / 365 for paid.

4. **(If still needed) TimescaleDB hypertable.** Only after #3 if a single
   workspace is generating >10M executions/month and the partition pruner
   is no longer enough. Convert `execution` to a hypertable partitioned by
   `startedAt`, define a continuous aggregate that materializes the same
   shape as `ExecutionStat` (and retire the manual rollup). Adds a Postgres
   extension dependency; defer unless we hit the wall.

**Cross-references:**
- Builds on the rollup landed alongside this entry.
- Subsumes item #6 (Metrics Dashboard) once the side table + streams land.

**Estimated effort:**
- Payload side table: 4 hours (schema + orchestrator + list query).
- Redis Streams migration: 6 hours (publisher + persistExecutionSteps +
  feature flag for cutover).
- Retention/partitioning: 8 hours (migration with `ATTACH PARTITION` of
  existing data, cron job, settings UI).
- Timescale: 1–2 days, only if triggered.

---

## Prioritized Implementation Order

1. **Redis AOF** - Do this first, essential for data safety
2. **Dead Letter Queue** - Important for production debugging
3. **Periodic Checkpoints** - Only if running long workflows
4. **Parallel Execution** - Performance improvement
5. **Caching** - Performance improvement
6. **Time-Series Storage Rewrite** - Required before hitting ~10M executions
7. **Metrics Dashboard** - Nice to have (subsumed by #8)
8. **Webhook Logs** - Nice to have

---

## Legend

| Priority | Meaning |
|----------|---------|
| 🔴 High | Critical for production reliability |
| 🟡 Medium | Important improvement |
| 🟢 Low | Nice to have, can defer |
