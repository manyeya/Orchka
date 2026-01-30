'use client';

import { Button } from "@/components/ui/button";
import { useExecuteWorkflow, useScheduleWorkflow, useUnscheduleWorkflow, useScheduleStatus } from "@/features/workflows/hooks/use-workflows";
import { Play, Clock, Pause, Loader2 } from "lucide-react";
import { useAtomValue } from "jotai";
import { nodesAtom } from "../store";
import { useMemo } from "react";
import { NodeType } from "@/features/nodes/types";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

interface ExecuteWorkflowButtonProps {
    workflowId: string;
}

interface CronTriggerData {
    name?: string;
    cronPattern?: string;
    timezone?: string;
    enabled?: boolean;
}

export function ExecuteWorkflowButton({ workflowId }: ExecuteWorkflowButtonProps) {
    const executeWorkflow = useExecuteWorkflow();
    const scheduleWorkflow = useScheduleWorkflow();
    const unscheduleWorkflow = useUnscheduleWorkflow();
    const nodes = useAtomValue(nodesAtom);
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    // Fetch schedule status from server
    const { data: scheduleStatus } = useScheduleStatus(workflowId);

    // Find cron trigger node if exists
    const cronTriggerNode = useMemo(() => {
        return nodes.find(node => node.type === NodeType.CRON_TRIGGER);
    }, [nodes]);

    // Check if this is a cron-triggered workflow
    const isCronWorkflow = !!cronTriggerNode;
    const cronData = cronTriggerNode?.data as CronTriggerData | undefined;

    // Use server state for schedule status
    const isScheduled = scheduleStatus?.isScheduled ?? false;

    const invalidateScheduleStatus = () => {
        queryClient.invalidateQueries(trpc.workflows.getScheduleStatus.queryOptions({ id: workflowId }));
    };

    const handleClick = () => {
        if (isCronWorkflow && cronData?.cronPattern) {
            if (isScheduled) {
                // Unschedule the workflow
                unscheduleWorkflow.mutate(
                    { id: workflowId },
                    {
                        onSuccess: () => {
                            invalidateScheduleStatus();
                        }
                    }
                );
            } else {
                // Schedule the workflow
                scheduleWorkflow.mutate(
                    {
                        id: workflowId,
                        cronPattern: cronData.cronPattern,
                        timezone: cronData.timezone || "UTC",
                    },
                    {
                        onSuccess: () => {
                            invalidateScheduleStatus();
                        }
                    }
                );
            }
        } else {
            // Execute immediately (manual trigger)
            executeWorkflow.mutate({ id: workflowId });
        }
    };

    const isPending = executeWorkflow.isPending || scheduleWorkflow.isPending || unscheduleWorkflow.isPending;

    if (isCronWorkflow) {
        return (
            <Button
                className="cursor-pointer"
                size="lg"
                variant={isScheduled ? "destructive" : "default"}
                onClick={handleClick}
                disabled={isPending || !cronData?.cronPattern}
            >
                {isPending ? (
                    <>
                        <Loader2 className="size-4 animate-spin" /> Loading...
                    </>
                ) : isScheduled ? (
                    <>
                        <Pause className="size-4" /> Stop Schedule
                    </>
                ) : (
                    <>
                        <Clock className="size-4" /> Start Schedule
                    </>
                )}
            </Button>
        );
    }

    return (
        <Button
            className="cursor-pointer"
            size="lg"
            onClick={handleClick}
            disabled={isPending}
        >
            {isPending ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                <Play className="size-4" />
            )} Execute Workflow
        </Button>
    );
}