-- Backfill: fix execution steps that were frozen as RUNNING by an ordering
-- bug in the orchestrator's catch block, where persistExecutionSteps ran
-- before the node-status:error event was published. Only touches steps
-- whose parent execution already terminated as FAILED and whose own row
-- still lacks a completedAt, so in-flight runs are not affected.

UPDATE "execution_step" AS s
SET
    "status" = 'FAILED',
    "completedAt" = COALESCE(s."completedAt", s."startedAt")
FROM "execution" AS e
WHERE s."executionId" = e."id"
  AND e."status" = 'FAILED'
  AND s."status" = 'RUNNING'
  AND s."completedAt" IS NULL;
