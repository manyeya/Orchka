import { Queue, FlowProducer, QueueEvents, Worker } from 'bullmq';

export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
};

export const workflowQueue = new Queue('workflows', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

export const nodeQueue = new Queue('nodes', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

export const webhookQueue = new Queue('webhooks', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
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
