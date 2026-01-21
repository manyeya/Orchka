import { startWorkflowWorker, startNodeWorker } from './workers';
import { setupQueueEvents } from './events';
import { closeBullMQConnections } from './setup';

async function main() {
  console.log('[BullMQ] Starting workers...');

  setupQueueEvents();

  startWorkflowWorker();
  startNodeWorker();

  console.log('[BullMQ] Workers started');

  process.on('SIGTERM', async () => {
    console.log('[BullMQ] Received SIGTERM, shutting down...');
    await closeBullMQConnections();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[BullMQ] Received SIGINT, shutting down...');
    await closeBullMQConnections();
    process.exit(0);
  });
}

main().catch(error => {
  console.error('[BullMQ] Fatal error:', error);
  process.exit(1);
});
