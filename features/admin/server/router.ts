import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { workflowQueue, nodeQueue, webhookQueue } from "@/bullmq/setup";
import { Queue } from "bullmq";

interface RepeatableJobInfo {
    key: string;
    name: string;
    id: string | null;
    cron: string;
    next: number;
}

interface QueueStatsResult {
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    waiting: number;
    paused: number;
    prioritized: number;
    isPaused: boolean;
    scheduledCount: number;
    repeatableJobs: RepeatableJobInfo[];
}

async function getQueueStats(queue: Queue): Promise<QueueStatsResult> {
    const counts = await queue.getJobCounts(
        'active',
        'completed',
        'failed',
        'delayed',
        'waiting',
        'paused',
        'prioritized'
    );

    const isPaused = await queue.isPaused();

    // In BullMQ 5, repeatable jobs are accessed via job schedulers
    const repeatableJobs = await queue.getJobSchedulers();

    return {
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
        waiting: counts.waiting || 0,
        paused: counts.paused || 0,
        prioritized: counts.prioritized || 0,
        isPaused,
        scheduledCount: repeatableJobs.length,
        repeatableJobs: repeatableJobs.map((j: any) => ({
            key: j.key,
            name: j.name,
            id: j.id || null,
            cron: j.pattern || j.cron || '', // Handle different BullMQ versions/field names
            next: j.next || 0,
        })),
    };
}

export const adminRouter = createTRPCRouter({
    getBullMQStats: protectedProcedure.query(async () => {
        const [workflowStats, nodeStats, webhookStats] = await Promise.all([
            getQueueStats(workflowQueue),
            getQueueStats(nodeQueue),
            getQueueStats(webhookQueue),
        ]);

        return {
            queues: [
                { name: 'workflows', ...workflowStats },
                { name: 'nodes', ...nodeStats },
                { name: 'webhooks', ...webhookStats },
            ],
            timestamp: new Date().toISOString(),
        };
    }),
});
