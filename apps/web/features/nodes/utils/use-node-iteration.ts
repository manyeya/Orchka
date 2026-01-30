"use client";

import { useAtomValue } from "jotai";
import { nodeIterationAtom, type LoopIterationProgress } from "@/features/editor/store";

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
    const iterations = useAtomValue(nodeIterationAtom);
    return iterations[nodeId];
};
