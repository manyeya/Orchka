import { NextRequest } from 'next/server';
import { workflowQueueEvents, nodeQueueEvents } from '@/bullmq/setup';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workflowId } = await params;

  const encoder = new TextEncoder();

  // We need a way to send messages to the stream
  let controller: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    }
  });

  function sendSSE(data: Record<string, unknown>) {
    if (!controller) return;
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (e) {
      console.error('[SSE] Error enqueuing message:', e);
    }
  }

  const workflowListener = ({ jobId }: { jobId: string }) => {
    sendSSE({ type: 'workflow-completed', jobId });
  };

  const workflowFailedListener = ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    sendSSE({ type: 'workflow-failed', jobId, error: failedReason });
  };

  const nodeListener = ({ jobId }: { jobId: string }) => {
    sendSSE({ type: 'node-completed', jobId });
  };

  const nodeFailedListener = ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    sendSSE({ type: 'node-failed', jobId, error: failedReason });
  };

  workflowQueueEvents.on('completed', workflowListener);
  workflowQueueEvents.on('failed', workflowFailedListener);
  nodeQueueEvents.on('completed', nodeListener);
  nodeQueueEvents.on('failed', nodeFailedListener);

  // Subscribe to Redis for custom node events
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  const redisChannel = `workflow:${workflowId}:events`;

  console.log(`[SSE] Subscribing to Redis channel: ${redisChannel}`);
  redis.subscribe(redisChannel, (err, count) => {
    if (err) console.error('[SSE] Redis subscribe error:', err);
    else console.log(`[SSE] Subscribed successfully. Count: ${count}`);
  });

  redis.on('message', (channel: string, message: string) => {
    console.log(`[SSE] Received Redis message on ${channel}:`, message.slice(0, 50));
    if (channel === redisChannel) {
      try {
        const data = JSON.parse(message);
        sendSSE({
          type: 'node-status',
          ...data,
        });
      } catch (e) {
        console.error('[SSE] Error parsing Redis message:', e);
      }
    }
  });

  req.signal.addEventListener('abort', () => {
    workflowQueueEvents.removeListener('completed', workflowListener);
    workflowQueueEvents.removeListener('failed', workflowFailedListener);
    nodeQueueEvents.removeListener('completed', nodeListener);
    nodeQueueEvents.removeListener('failed', nodeFailedListener);
    redis.quit();
    if (controller) {
      try {
        controller.close();
      } catch (e) { }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
