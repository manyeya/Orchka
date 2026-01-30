import { workflowQueueEvents, nodeQueueEvents } from './setup';
import { publishWorkflowEvent } from './publisher';

export function setupQueueEvents() {
  workflowQueueEvents.on('waiting', ({ jobId, }) => {
    console.log(`[Workflow Queue] Job ${jobId} is waiting`);
  });

  workflowQueueEvents.on('active', ({ jobId, prev }) => {
    console.log(`[Workflow Queue] Job ${jobId} is now active (was: ${prev})`);
  });

  
  workflowQueueEvents.on('completed', ({ jobId, returnvalue }) => {
    console.log(`[Workflow Queue] Job ${jobId} completed:`, returnvalue);

    if (returnvalue && typeof returnvalue === 'object') {
      const { workflowId, executionId } = returnvalue as any;
      publishWorkflowEvent(workflowId, executionId, {
        type: 'workflow-completed',
        result: returnvalue,
      });
    }
  });

  workflowQueueEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`[Workflow Queue] Job ${jobId} failed:`, failedReason);

    if (failedReason && typeof failedReason === 'object') {
      const { workflowId, executionId } = (failedReason as any).data || {};
      if (workflowId) {
        publishWorkflowEvent(workflowId, executionId || '', {
          type: 'workflow-failed',

          error: failedReason,
        });
      }
    }
  });

  workflowQueueEvents.on('stalled', ({ jobId }) => {
    console.warn(`[Workflow Queue] Job ${jobId} stalled`);
  });

  nodeQueueEvents.on('waiting', ({ jobId }) => {
    console.log(`[Node Queue] Job ${jobId} is waiting`);
  });

  nodeQueueEvents.on('active', ({ jobId, prev }) => {
    console.log(`[Node Queue] Job ${jobId} is now active (was: ${prev})`);
  });

  nodeQueueEvents.on('completed', ({ jobId, returnvalue }) => {
    console.log(`[Node Queue] Job ${jobId} completed:`, returnvalue);
  });

  nodeQueueEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`[Node Queue] Job ${jobId} failed:`, failedReason);
  });

  nodeQueueEvents.on('progress', ({ jobId, data }) => {
    console.log(`[Node Queue] Job ${jobId} progress:`, data);
  });

  nodeQueueEvents.on('stalled', ({ jobId }) => {
    console.warn(`[Node Queue] Job ${jobId} stalled`);
  });

  console.log('BullMQ Queue Events initialized');
}
