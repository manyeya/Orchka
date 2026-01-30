import { workflowQueue } from './setup';

interface SchedulerConfig {
  workflowId: string;
  cronPattern?: string;
  intervalMs?: number;
  endDate?: Date;
}

export async function upsertWorkflowScheduler(schedulerId: string, config: SchedulerConfig) {
  const { workflowId, cronPattern, intervalMs, endDate } = config;

  let repeatOptions: any = {};

  if (cronPattern) {
    repeatOptions.pattern = cronPattern;
  } else if (intervalMs) {
    repeatOptions.every = intervalMs;
  }

  if (endDate) {
    repeatOptions.endDate = endDate;
  }

  const job = await workflowQueue.upsertJobScheduler(
    schedulerId,
    repeatOptions,
    {
      name: 'scheduled-workflow',
      data: { workflowId },
    }
  );

  return job;
}

export async function removeWorkflowScheduler(schedulerId: string) {
  await workflowQueue.removeJobScheduler(schedulerId);
}

export async function getWorkflowSchedulers() {
  const schedulers = await workflowQueue.getJobSchedulers();
  return schedulers;
}

export async function getWorkflowScheduler(workflowId: string) {
  const schedulerId = `workflow-${workflowId}`;
  const schedulers = await workflowQueue.getJobSchedulers();

  console.log(`[Scheduler Debug] Looking for schedulerId: ${schedulerId}`);
  console.log(`[Scheduler Debug] Found schedulers:`, schedulers.map(s => ({ id: s.id, key: s.key, name: s.name })));

  // BullMQ stores the scheduler with the ID we provided
  const found = schedulers.find(s => s.id === schedulerId || s.key === schedulerId);
  console.log(`[Scheduler Debug] Match found:`, found ? 'yes' : 'no');

  return found || null;
}

export async function startWorkflowScheduler(workflowId: string, schedulerId: string, cronPattern: string) {
  await upsertWorkflowScheduler(schedulerId, {
    workflowId,
    cronPattern,
  });
}
