"use client";

import { useNodeEditorBridge } from "@orchka/nodes/editor";

interface UseNodeExecutionDataOptions {
    nodeId: string;
}

/**
 * Hook to retrieve node execution data from the central RealtimeManager.
 */
export const useNodeExecutionData = ({ nodeId }: UseNodeExecutionDataOptions) => {
    const { nodeExecutionData: executionData } = useNodeEditorBridge();
    const nodeData = executionData[nodeId];

    return {
        input: nodeData?.input ?? null,
        output: nodeData?.output ?? null,
        timestamp: nodeData?.timestamp ?? null,
        hasData: !!nodeData,
    };
};
