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

export async function removeWorkflowScheduler(schedulerId: string, cronPattern?: string) {
  let options: any = undefined;

  if (cronPattern) {
    options = { pattern: cronPattern };
  }

  await workflowQueue.removeJobScheduler(schedulerId, options);
}

export async function getWorkflowSchedulers() {
  const schedulers = await workflowQueue.getJobSchedulers();
  return schedulers;
}



export async function startWorkflowScheduler(workflowId: string, schedulerId: string, cronPattern: string) {
  await upsertWorkflowScheduler(schedulerId, {
    workflowId,
    cronPattern,
  });
}
