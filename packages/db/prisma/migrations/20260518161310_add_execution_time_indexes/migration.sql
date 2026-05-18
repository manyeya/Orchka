-- CreateIndex
CREATE INDEX "execution_userId_startedAt_idx" ON "execution"("userId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "execution_userId_status_startedAt_idx" ON "execution"("userId", "status", "startedAt" DESC);
