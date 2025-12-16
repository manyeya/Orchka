"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { nodeExecutionDataAtom, type NodeExecutionData } from "@/features/editor/store";
import { getWorkflowNodeToken, workflowNodeChannel } from "@/features/nodes/utils/realtime";

interface UseNodeExecutionDataOptions {
    nodeId: string;
}

/**
 * Hook to subscribe to and retrieve node execution data (input/output).
 * Uses Inngest realtime to receive data updates during workflow execution.
 * 
 * @example
 * ```typescript
 * const { input, output, hasData } = useNodeExecutionData({ nodeId: "node-123" });
 * ```
 */
export const useNodeExecutionData = ({ nodeId }: UseNodeExecutionDataOptions) => {
    const [executionData, setExecutionData] = useAtom(nodeExecutionDataAtom);

    const { data: messages } = useInngestSubscription({
        refreshToken: getWorkflowNodeToken,
        enabled: true,
    });

    useEffect(() => {
        if (!messages.length) return;

        // Find the latest data message for this node
        // We use explicit any casts because the Inngest types don't fully support
        // union discrimination for multiple topics on the same channel
        for (let i = messages.length - 1; i >= 0; i--) {
            const message = messages[i] as {
                kind: string;
                topic: string;
                channel: string;
                data: { nodeId: string; input?: unknown; output?: unknown };
                createdAt: Date;
            };

            if (
                message.kind === "data" &&
                message.topic === "data" &&
                message.channel === workflowNodeChannel().name &&
                message.data?.nodeId === nodeId &&
                message.data?.input !== undefined
            ) {
                const newData: NodeExecutionData = {
                    input: message.data.input,
                    output: message.data.output,
                    timestamp: message.createdAt.getTime(),
                };

                setExecutionData((prev) => ({
                    ...prev,
                    [nodeId]: newData,
                }));
                break; // Found the latest, stop looking
            }
        }
    }, [messages, nodeId, setExecutionData]);

    const nodeData = executionData[nodeId];

    return {
        input: nodeData?.input ?? null,
        output: nodeData?.output ?? null,
        timestamp: nodeData?.timestamp ?? null,
        hasData: !!nodeData,
    };
};
