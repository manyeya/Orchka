import { NextRequest, NextResponse } from 'next/server';
import { workflowQueueEvents, nodeQueueEvents } from '@/bullmq/setup';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const workflowId = params.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendSSE = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (error) {
          console.error('[SSE] Error sending:', error);
        }
      };

      const workflowListener = ({ jobId, returnvalue }: any) => {
        const jobData = (returnvalue as any)?.data || {};
        if (jobData.workflowId === workflowId || (returnvalue as any)?.workflowId === workflowId) {
          sendSSE({
            type: 'job-completed',
            jobId,
            data: returnvalue,
          });
        }
      };

      const nodeListener = ({ jobId, returnvalue, failedReason }: any) => {
        const jobData = (returnvalue as any)?.data || {};
        if (jobData.workflowId === workflowId) {
          if (failedReason) {
            sendSSE({
              type: 'node-failed',
              jobId,
              nodeId: jobData.nodeId,
              error: failedReason,
            });
          } else {
            sendSSE({
              type: 'node-completed',
              jobId,
              nodeId: jobData.nodeId,
              data: returnvalue,
            });
          }
        }
      };

      const workflowFailedListener = ({ jobId, failedReason }: any) => {
        const jobData = (failedReason as any)?.data || {};
        if (jobData.workflowId === workflowId) {
          sendSSE({
            type: 'workflow-failed',
            jobId,
            error: failedReason,
          });
        }
      };

      workflowQueueEvents.on('completed', workflowListener);
      workflowQueueEvents.on('failed', workflowFailedListener);
      nodeQueueEvents.on('completed', nodeListener);
      nodeQueueEvents.on('failed', nodeListener);

      req.signal.addEventListener('abort', () => {
        workflowQueueEvents.removeListener('completed', workflowListener);
        workflowQueueEvents.removeListener('failed', workflowFailedListener);
        nodeQueueEvents.removeListener('completed', nodeListener);
        nodeQueueEvents.removeListener('failed', nodeListener);
        controller.close();
      });

      sendSSE({ type: 'connected', workflowId });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
