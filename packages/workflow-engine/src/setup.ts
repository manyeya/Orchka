import { Queue, FlowProducer, QueueEvents } from 'bullmq';

const redisUrl = process.env.REDIS_URL ? new URL(process.env.REDIS_URL) : null;

export const redisConnection = {
  host: redisUrl ? redisUrl.hostname : (process.env.REDIS_HOST || 'localhost'),
  port: redisUrl ? parseInt(redisUrl.port) : parseInt(process.env.REDIS_PORT || '6379'),
  password: redisUrl ? (redisUrl.password || undefined) : (process.env.REDIS_PASSWORD || undefined),
  maxRetriesPerRequest: null,
};

export const workflowQueue = new Queue('workflows', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: true,
  },
});

export const nodeQueue = new Queue('nodes', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: true,
  },
});

export const webhookQueue = new Queue('webhooks', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: true,
  },
});

export const flowProducer = new FlowProducer({
  connection: redisConnection,
});


export const workflowQueueEvents = new QueueEvents('workflows', {
  connection: redisConnection,
});

export const nodeQueueEvents = new QueueEvents('nodes', {
  connection: redisConnection,
});

export async function closeBullMQConnections() {
  await workflowQueue.close();
  await nodeQueue.close();
  await webhookQueue.close();
  await flowProducer.close();
  await workflowQueueEvents.close();
  await nodeQueueEvents.close();
}
