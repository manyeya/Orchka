import type { Job } from 'bullmq';
import { deadLetterQueue, nodeQueue } from './setup';
import type { NodeJobData } from './orchestrator';

/**
 * Park a terminally-failed node job in the dead-letter queue. Called from the
 * node worker's `failed` handler once BullMQ has exhausted the job's attempts
 * (or for side-effecting nodes that never retry). The DLQ entry carries the
 * full NodeJobData payload, so it can later be re-queued onto `nodeQueue`
 * unchanged for a deliberate manual retry.
 */
export async function moveToDeadLetter(
  job: Job<NodeJobData>,
  error: Error
): Promise<void> {
  const data = job.data;
  await deadLetterQueue.add(
    `dlq:${data.nodeType}:${data.nodeName}`,
    {
      // The original job payload, verbatim, so re-queue is a straight copy.
      original: data,
      // Triage metadata.
      failedJobId: job.id,
      queue: job.queueName,
      attemptsMade: job.attemptsMade,
      error: { message: error.message, stack: error.stack },
      failedAt: Date.now(),
    },
    { jobId: `dlq:${data.executionId}:${data.nodeId}` }
  );
  console.error(
    `[DLQ] Parked node ${data.nodeName} (${data.nodeType}) from execution ${data.executionId} after ${job.attemptsMade} attempt(s)`
  );
}

/**
 * Re-queue a dead-letter entry back onto the node queue using its preserved
 * payload, then drop the DLQ record. Surface for an admin "retry" action.
 */
export async function requeueFromDeadLetter(dlqJobId: string): Promise<boolean> {
  const dlqJob = await deadLetterQueue.getJob(dlqJobId);
  if (!dlqJob) return false;

  const original = dlqJob.data.original as NodeJobData;
  await nodeQueue.add(`node:${original.nodeType}:${original.nodeName}`, original);
  await dlqJob.remove();
  return true;
}

/**
 * Whether a failed job has truly exhausted its retries (vs. having attempts
 * left and being retried by BullMQ). `attempts` defaults to 1 when unset.
 */
export function isTerminalFailure(job: Job): boolean {
  const maxAttempts = job.opts.attempts ?? 1;
  return job.attemptsMade >= maxAttempts;
}
