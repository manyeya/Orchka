import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export type PublishFn = (payload: {
    nodeId: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    nodeType: string;
    iteration?: { index: number; total: number };
}) => Promise<void>;

/**
 * Publish workflow execution events to Redis for real-time updates and history
 * @param workflowId - The workflow ID
 * @param executionId - The execution ID (for history tracking per execution)
 * @param payload - Event payload with node status
 */
export async function publishWorkflowEvent(workflowId: string, executionId: string, payload: Record<string, unknown>) {
    // Pub/sub for real-time UI updates
    const channel = `workflow:${workflowId}:events`;
    const result = await redis.publish(channel, JSON.stringify({ ...payload, executionId }));
    console.log(`[Publisher] Publish result: ${result}`);

    // Store in execution-specific history for lazy persistence
    const historyKey = `workflow:${workflowId}:execution:${executionId}:history`;
    await redis.lpush(historyKey, JSON.stringify({ payload, timestamp: Date.now() }));
    await redis.ltrim(historyKey, 0, 100);
}

export async function closeRedis() {
    await redis.quit();
}
