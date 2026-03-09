import { logger } from "@orchka/nodes/core";
import type { NodeExecutor, WorkflowContext, BranchDecision } from "../../utils/execution/types";
import { evaluate, type ExpressionContext } from "@orchka/expression-engine";
import type { WaitNodeData } from "../types";

/**
 * Result from Wait Node execution including branch decision
 */
export interface WaitNodeResult {
  context: WorkflowContext;
  branchDecision: BranchDecision;
}

/**
 * Wait Node Executor
 * 
 * NOTE: This executor is NOT actually called by the BullMQ orchestrator.
 * The orchestrator has built-in handleWaitNode() function that calculates
 * the delay and uses BullMQ's delayed jobs instead of step.sleep.
 * 
 * This executor exists for type completeness and fallback scenarios.
 * The actual wait handling is in bullmq/orchestrator.ts handleWaitNode().
 */
export const waitNodeExecutor: NodeExecutor<WaitNodeData> = async ({
  data,
  nodeId,
  context,
}): Promise<WorkflowContext> => {
  const nodeName = data.name || "Wait";

  // This should not be called - orchestrator handles WAIT nodes directly
  // But if it is, just pass through with the delay info
  logger.warn("Wait Node executor called - orchestrator should handle WAIT nodes directly");

  return {
    ...context,
    [nodeName]: {
      completed: true,
      mode: data.mode,
      ...(data.duration && { duration: data.duration }),
      ...(data.until && { until: data.until }),
    },
    __branchDecision: {
      branch: "main",
      data: { mode: data.mode },
    },
  };
};
