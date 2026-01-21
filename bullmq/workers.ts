import { Worker } from 'bullmq';
import { redisConnection } from './setup';
import { executeWorkflowJob } from './orchestrator';

export let workflowWorker: Worker | null = null;
export let nodeWorker: Worker | null = null;

export function startWorkflowWorker() {
  workflowWorker = new Worker(
    'workflows',
    async (job) => {
      console.log(`[Workflow Worker] Processing job ${job.id}`, job.data);
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
      console.log(`[Node Worker] Processing job ${job.id}`, job.data);
      const { executor, data, nodeId, context, expressionContext, publish, resolveCredential } = job.data;
      return await executor({ data, nodeId, context, expressionContext, publish, resolveCredential });
    },
    {
      connection: redisConnection,
      concurrency: 10,
    }
  );

  nodeWorker.on('completed', (job, result) => {
    console.log(`[Node Worker] Job ${job.id} completed`, result);
  });

  nodeWorker.on('failed', (job, error) => {
    console.error(`[Node Worker] Job ${job?.id} failed:`, error);
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
