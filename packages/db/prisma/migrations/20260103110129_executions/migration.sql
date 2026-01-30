-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "execution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'RUNNING',
    "inngestRunId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "execution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "execution_workflowId_idx" ON "execution"("workflowId");

-- CreateIndex
CREATE INDEX "execution_userId_idx" ON "execution"("userId");

-- CreateIndex
CREATE INDEX "execution_status_idx" ON "execution"("status");

-- AddForeignKey
ALTER TABLE "execution" ADD CONSTRAINT "execution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution" ADD CONSTRAINT "execution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
