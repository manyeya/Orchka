import { NodeExecutor } from "../../utils/execution/types";

interface CronTriggerData {
    name?: string;
    cronPattern?: string;
    timezone?: string;
    enabled?: boolean;
}

export const cronTriggerExecutor: NodeExecutor<CronTriggerData> = async ({
    context,
    data,
}) => {
    // Cron trigger passes through the context with cron metadata
    // The actual scheduling is handled by BullMQ job schedulers
    return {
        ...context,
        cron: {
            pattern: data?.cronPattern || "0 * * * *",
            timezone: data?.timezone || "UTC",
            triggeredAt: new Date().toISOString(),
        }
    };
}
