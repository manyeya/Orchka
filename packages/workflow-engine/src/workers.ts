import { Worker } from 'bullmq';
import { redisConnection } from './setup';
import { executeWorkflowJob, executeNodeJob } from './orchestrator';
import { moveToDeadLetter, isTerminalFailure } from './dead-letter';

export let workflowWorker: Worker | null = null;
export let nodeWorker: Worker | null = null;

export function startWorkflowWorker() {
  workflowWorker = new Worker(
    'workflows',
    async (job) => {
      console.log(`[Workflow Worker] Processing workflow job ${job.id}`, job.data);
      return await executeWorkflowJob(job);
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  workflowWorker.on('completed', (job, result) => {
    console.log(`[Workflow Worker] Job ${job.id} completed`, result);
  });

  workflowWorker.on('failed', (job, error) => {
    console.error(`[Workflow Worker] Job ${job?.id} failed:`, error);
  });

  workflowWorker.on('error', (error) => {
    console.error('[Workflow Worker] Worker error:', error);
  });

  console.log('[Workflow Worker] Started');
}

export function startNodeWorker() {
  nodeWorker = new Worker(
    'nodes',
    async (job) => {
      console.log(`[Node Worker] Processing node job ${job.id}:`, job.name);
      return await executeNodeJob(job);
    },
    {
      connection: redisConnection,
      concurrency: 10,
    }
  );

  nodeWorker.on('completed', (job, result) => {
    console.log(`[Node Worker] Job ${job.id} completed:`, job.name);
  });

  nodeWorker.on('failed', async (job, error) => {
    console.error(`[Node Worker] Job ${job?.id} failed:`, job?.name, error);
    // Once retries are exhausted (or the node never retries), park the job in
    // the dead-letter queue so it isn't silently lost when removeOnFail prunes it.
    if (job && isTerminalFailure(job)) {
      try {
        await moveToDeadLetter(job, error);
      } catch (dlqError) {
        console.error('[Node Worker] Failed to move job to dead-letter queue:', dlqError);
      }
    }
  });

  nodeWorker.on('error', (error) => {
    console.error('[Node Worker] Worker error:', error);
  });

  console.log('[Node Worker] Started');
}

export async function stopWorkers() {
  if (workflowWorker) {
    await workflowWorker.close();
    workflowWorker = null;
  }
  if (nodeWorker) {
    await nodeWorker.close();
    nodeWorker = null;
  }
}
