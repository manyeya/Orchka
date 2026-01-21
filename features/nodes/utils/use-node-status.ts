"use client";

import { useAtomValue } from "jotai";
import { nodeStatusesAtom } from "@/features/editor/store";
import { WorkflowNodeStatus } from "@/components/workflow-node";

interface UseNodeStatusOptions {
    nodeId: string;
}

/**
 * Hook to read real-time node status from the central RealtimeManager.
 */
export const useNodeStatus = ({
    nodeId,
}: UseNodeStatusOptions): WorkflowNodeStatus => {
    const statuses = useAtomValue(nodeStatusesAtom);
    return statuses[nodeId] || 'initial';
};