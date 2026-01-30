import { logger } from "@/lib/logger";
import type { NodeExecutor, WorkflowContext, BranchDecision } from "../../utils/execution/types";
import { evaluate, type ExpressionContext } from "@/features/editor/utils/expression-engine";
import type { IfNodeData } from "../types";

/**
 * Result from If Node execution including branch decision
 */
export interface IfNodeResult {
  context: WorkflowContext;
  branchDecision: BranchDecision;
}

/**
 * Evaluates a condition expression and returns a boolean result.
 * Handles empty/invalid conditions by returning false.
 */
export async function evaluateIfCondition(
  condition: unknown,
  expressionContext: ExpressionContext
): Promise<boolean> {
  if (condition === null || condition === undefined) {
    logger.warn("If Node: Empty condition, treating as false");
    return false;
  }

  if (typeof condition === "boolean") {
    return condition;
  }

  if (typeof condition === "number") {
    return condition !== 0;
  }

  if (typeof condition !== "string") {
    return Boolean(condition);
  }

  if (condition.trim() === "") {
    logger.warn("If Node: Empty condition, treating as false");
    return false;
  }

  try {
    const result = await evaluate(condition, expressionContext);

    if (typeof result === "boolean") {
      return result;
    }

    if (typeof result === "string") {
      const lower = result.toLowerCase().trim();
      if (lower === "true") return true;
      if (lower === "false") return false;
    }

    return Boolean(result);
  } catch (error) {
    logger.warn({ err: error }, "If Node: Error evaluating condition, treating as false");
    return false;
  }
}

/**
 * If Node Executor
 * 
 * Evaluates a condition expression and returns a branch decision.
 * The orchestrator handles branch routing based on __branchDecision.
 */
export const ifNodeExecutor: NodeExecutor<IfNodeData> = async ({
  data,
  nodeId,
  context,
  expressionContext,
}): Promise<WorkflowContext> => {
  const nodeName = data.name || "If";

  if (!expressionContext) {
    logger.warn("If Node: No expression context provided, treating condition as false");
    return {
      ...context,
      [nodeName]: {
        branch: "false",
        condition: data.condition,
        result: false,
      },
      __branchDecision: {
        branch: "false",
        data: { conditionResult: false, reason: "no_expression_context" },
      },
    };
  }

  const conditionResult = await evaluateIfCondition(data.condition as unknown, expressionContext);
  const branch = conditionResult ? "true" : "false";

  return {
    ...context,
    [nodeName]: {
      branch,
      condition: data.condition,
      result: conditionResult,
    },
    __branchDecision: {
      branch,
      data: { conditionResult },
    },
  };
};
