-- CreateTable
CREATE TABLE "execution_step" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "nodeName" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,

    CONSTRAINT "execution_step_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "execution_step_executionId_idx" ON "execution_step"("executionId");

-- AddForeignKey
ALTER TABLE "execution_step" ADD CONSTRAINT "execution_step_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
