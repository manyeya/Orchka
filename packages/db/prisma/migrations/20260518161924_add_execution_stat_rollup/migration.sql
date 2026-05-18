-- CreateTable
CREATE TABLE "execution_stat" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "userId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "succeeded" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "cancelled" INTEGER NOT NULL DEFAULT 0,
    "durationMs" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "execution_stat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "execution_stat_userId_date_idx" ON "execution_stat"("userId", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "execution_stat_userId_workflowId_date_key" ON "execution_stat"("userId", "workflowId", "date");

-- Backfill ExecutionStat from existing terminal executions so the dashboard
-- cards reflect history rather than starting from zero. RUNNING rows are
-- skipped: they roll up only when finalized via the orchestrator.
INSERT INTO "execution_stat" (
    "id",
    "date",
    "userId",
    "workflowId",
    "total",
    "succeeded",
    "failed",
    "cancelled",
    "durationMs",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text AS "id",
    DATE("startedAt" AT TIME ZONE 'UTC') AS "date",
    "userId",
    "workflowId",
    COUNT(*)::int AS "total",
    COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::int AS "succeeded",
    COUNT(*) FILTER (WHERE "status" = 'FAILED')::int AS "failed",
    COUNT(*) FILTER (WHERE "status" = 'CANCELLED')::int AS "cancelled",
    COALESCE(
        SUM(EXTRACT(EPOCH FROM ("completedAt" - "startedAt")) * 1000)
            FILTER (WHERE "status" = 'COMPLETED' AND "completedAt" IS NOT NULL),
        0
    )::bigint AS "durationMs",
    NOW() AS "updatedAt"
FROM "execution"
WHERE "status" IN ('COMPLETED', 'FAILED', 'CANCELLED')
GROUP BY DATE("startedAt" AT TIME ZONE 'UTC'), "userId", "workflowId"
ON CONFLICT ("userId", "workflowId", "date") DO NOTHING;
