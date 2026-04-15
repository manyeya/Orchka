"use client";

import { useNodeEditorBridge } from "@orchka/nodes/editor";
import type { WorkflowNodeStatus } from "@orchka/nodes/editor";

interface UseNodeStatusOptions {
    nodeId: string;
}

/**
 * Hook to read real-time node status from the central RealtimeManager.
 */
export const useNodeStatus = ({
    nodeId,
}: UseNodeStatusOptions): WorkflowNodeStatus => {
    const bridge = useNodeEditorBridge();
    return bridge.nodeStatuses[nodeId] || "initial";
};
