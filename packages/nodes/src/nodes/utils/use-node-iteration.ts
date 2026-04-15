"use client";

import { useNodeEditorBridge, type LoopIterationProgress } from "@orchka/nodes/editor";

interface UseNodeIterationOptions {
    nodeId: string;
}

/**
 * Hook to read real-time loop iteration progress from the central RealtimeManager.
 * Returns undefined if no iteration is in progress.
 */
export const useNodeIteration = ({
    nodeId,
}: UseNodeIterationOptions): LoopIterationProgress | undefined => {
    const bridge = useNodeEditorBridge();
    return bridge.nodeIterations[nodeId];
};
