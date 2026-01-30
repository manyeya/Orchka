import { logger } from "@/lib/logger";
import type { NodeExecutor, WorkflowContext, BranchDecision } from "../../utils/execution/types";
import { evaluate, type ExpressionContext } from "@/features/editor/utils/expression-engine";
import type { LoopNodeData } from "../types";

/**
 * Result from Loop Node execution including branch decision
 */
export interface LoopNodeResult {
  context: WorkflowContext;
  branchDecision: BranchDecision;
}

/**
 * Iteration context provided to each loop iteration
 */
export interface LoopIterationContext {
  $item: unknown;
  $index: number;
  $total: number;
}

/**
 * Evaluates the array expression and returns an array to iterate over.
 */
export async function evaluateLoopArray(
  expression: unknown,
  expressionContext: ExpressionContext
): Promise<unknown[]> {
  if (expression === null || expression === undefined) {
    logger.warn("Loop Node: Empty array expression, returning empty array");
    return [];
  }

  if (Array.isArray(expression)) {
    return expression;
  }

  if (typeof expression !== "string") {
    logger.warn("Loop Node: Array expression resolved to non-array value, wrapping in array");
    return [expression];
  }

  if (expression.trim() === "") {
    logger.warn("Loop Node: Empty array expression, returning empty array");
    return [];
  }

  let result: unknown;
  try {
    result = await evaluate(expression, expressionContext);
  } catch (error) {
    logger.warn({ err: error }, "Loop Node: Error evaluating array expression, returning empty array");
    return [];
  }

  if (Array.isArray(result)) {
    return result;
  }

  if (result === null || result === undefined) {
    logger.warn("Loop Node: Array expression resolved to null/undefined, returning empty array");
    return [];
  }

  logger.warn("Loop Node: Array expression resolved to non-array value, wrapping in array");
  return [result];
}

/**
 * Generates an array of indices for count-based iteration.
 */
export function generateCountArray(count: number): number[] {
  if (count <= 0 || !Number.isFinite(count)) {
    logger.warn("Loop Node: Invalid count, returning empty array");
    return [];
  }
  return Array.from({ length: count }, (_, i) => i);
}

/**
 * Loop Node Executor
 * 
 * Prepares iteration data for the orchestrator's executeLoopBody function.
 * The orchestrator handles the actual iteration, not this executor.
 */
export const loopNodeExecutor: NodeExecutor<LoopNodeData> = async ({
  data,
  nodeId,
  context,
  expressionContext,
}): Promise<WorkflowContext> => {
  const nodeName = data.name || "Loop";

  let items: unknown[];

  if (data.mode === "array") {
    if (!expressionContext) {
      logger.warn("Loop Node: No expression context provided, using empty array");
      items = [];
    } else {
      items = await evaluateLoopArray(data.arrayExpression as unknown, expressionContext);
    }
  } else {
    items = generateCountArray(data.count || 0);
  }

  const total = items.length;
  const mode = data.mode;

  const branchDecision: BranchDecision = {
    branch: items.length > 0 ? "loop" : "done",
    data: {
      items,
      total,
      mode,
      currentIndex: 0,
      results: [],
    },
    iteration: items.length > 0 ? {
      index: 0,
      total,
      item: items[0],
    } : undefined,
  };

  return {
    ...context,
    [nodeName]: {
      items,
      total,
      mode,
      results: [],
      $item: items.length > 0 ? items[0] : undefined,
      $index: 0,
      $total: total,
    },
    __branchDecision: branchDecision,
    __loopNode: {
      nodeId,
      nodeName,
      items,
      total,
      mode,
      currentIndex: 0,
      results: [],
    },
  };
};
