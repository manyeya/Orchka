"use client";

import { useAtomValue } from "jotai";
import { nodeExecutionDataAtom } from "@/features/editor/store";

interface UseNodeExecutionDataOptions {
    nodeId: string;
}

/**
 * Hook to retrieve node execution data from the central RealtimeManager.
 */
export const useNodeExecutionData = ({ nodeId }: UseNodeExecutionDataOptions) => {
    const executionData = useAtomValue(nodeExecutionDataAtom);
    const nodeData = executionData[nodeId];

    return {
        input: nodeData?.input ?? null,
        output: nodeData?.output ?? null,
        timestamp: nodeData?.timestamp ?? null,
        hasData: !!nodeData,
    };
};
