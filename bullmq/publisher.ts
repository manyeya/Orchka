import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export type PublishFn = (payload: {
    nodeId: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    nodeType: string;
    iteration?: { index: number; total: number };
}) => Promise<void>;

export async function publishWorkflowEvent(workflowId: string, payload: unknown) {
    const channel = `workflow:${workflowId}:events`;
    console.log(`[Publisher] Publishing to ${channel}:`, JSON.stringify(payload).slice(0, 100));
    const result = await redis.publish(channel, JSON.stringify(payload));
    console.log(`[Publisher] Publish result: ${result}`);

    await redis.lpush(`workflow:${workflowId}:history`, JSON.stringify({ payload, timestamp: Date.now() }));
    await redis.ltrim(`workflow:${workflowId}:history`, 0, 100);
}

export async function closeRedis() {
    await redis.quit();
}
