import { config } from 'dotenv';
config();

async function main() {
  console.log('[BullMQ] Loading environment variables...');

  // Dynamic imports to ensure dotenv loads before modules that might use process.env
  const { startWorkflowWorker, startNodeWorker } = await import('./workers');
  const { setupQueueEvents } = await import('./events');
  const { closeBullMQConnections } = await import('./setup');

  console.log('[BullMQ] DATABASE_URL present:', !!process.env.DATABASE_URL);

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
