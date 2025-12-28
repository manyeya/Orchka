import { NodeType } from "@/features/nodes/types";
import { logger } from "@/lib/logger";
import type { NodeExecutor, WorkflowContext, BranchDecision } from "../../utils/execution/types";
import { publishNodeStatus } from "../../utils/realtime";
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
 * Handles non-array values by wrapping them in a single-element array.
 * 
 * @param expression - The array expression to evaluate (may already be resolved)
 * @param expressionContext - The expression context for evaluation
 * @returns Promise resolving to array to iterate over
 * 
 * Requirements:
 * - 3.3: Iterate over each element in the resolved array expression
 * - 3.7: Treat non-array values as single-element arrays
 */
export async function evaluateLoopArray(
  expression: unknown,
  expressionContext: ExpressionContext
): Promise<unknown[]> {
  // Handle null/undefined expression
  if (expression === null || expression === undefined) {
    logger.warn("Loop Node: Empty array expression, returning empty array");
    return [];
  }

  // If expression is already an array (pre-resolved), return it
  if (Array.isArray(expression)) {
    return expression;
  }

  // If expression is not a string, wrap it in an array
  if (typeof expression !== "string") {
    logger.warn("Loop Node: Array expression resolved to non-array value, wrapping in array");
    return [expression];
  }

  // Empty string expression returns empty array
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

  // If result is already an array, return it
  if (Array.isArray(result)) {
    return result;
  }

  // If result is null or undefined, return empty array
  if (result === null || result === undefined) {
    logger.warn("Loop Node: Array expression resolved to null/undefined, returning empty array");
    return [];
  }

  // Wrap non-array values in a single-element array
  logger.warn("Loop Node: Array expression resolved to non-array value, wrapping in array");
  return [result];
}


/**
 * Generates an array of indices for count-based iteration.
 * 
 * @param count - Number of iterations
 * @returns Array of indices [0, 1, 2, ..., count-1]
 * 
 * Requirements:
 * - 3.4: Iterate the specified number of times (1 to N)
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
 * Prepares iteration data for the workflow engine to execute connected "loop" 
 * body nodes for each iteration. After all iterations complete, the "done" 
 * branch is executed with aggregated results.
 * 
 * The workflow engine handles the actual iteration by:
 * 1. Getting the items array from the executor
 * 2. Executing nodes connected to "loop" output for each item
 * 3. Collecting results from each iteration
 * 4. Executing nodes connected to "done" output with aggregated results
 * 
 * Requirements:
 * - 3.3: Iterate over each element in array mode
 * - 3.4: Iterate specified number of times in count mode
 * - 3.5: Provide $item, $index, $total in expression context
 * - 3.6: Execute "done" branch with aggregated results after completion
 * - 3.7: Treat non-array values as single-element arrays
 * - 3.8: Publish status updates via realtime channel
 * - 3.9: Use Inngest step.run for each iteration
 */
export const loopNodeExecutor: NodeExecutor<LoopNodeData> = async ({
  data,
  nodeId,
  context,
  step,
  expressionContext,
  publish,
}): Promise<WorkflowContext> => {
  // Publish loading status
  await publishNodeStatus(publish, nodeId, "loading", NodeType.LOOP);

  const nodeName = data.name || "Loop";
  const stepName = `${nodeName} (${nodeId})`;

  try {
    // Determine the items to iterate over (within a step for durability)
    const loopSetup = await step.run(`${stepName} - setup`, async () => {
      let items: unknown[];

      if (data.mode === "array") {
        // Array mode: evaluate the array expression
        if (!expressionContext) {
          logger.warn("Loop Node: No expression context provided, using empty array");
          items = [];
        } else {
          items = await evaluateLoopArray(data.arrayExpression as unknown, expressionContext);
        }
      } else {
        // Count mode: generate array of indices
        items = generateCountArray(data.count || 0);
      }

      return {
        items,
        total: items.length,
        mode: data.mode,
      };
    });

    const { items, total, mode } = loopSetup;

    // Build the branch decision with loop-specific data
    // The workflow engine will use this to execute loop iterations
    const branchDecision: BranchDecision = {
      // Use "loop" as the branch when there are items to iterate
      // Use "done" when there are no items (empty loop)
      branch: items.length > 0 ? "loop" : "done",
      data: {
        items,
        total,
        mode,
        currentIndex: 0, // Start at index 0
        results: [], // Will be populated by workflow engine
      },
      // Provide initial iteration context for the first item
      iteration: items.length > 0 ? {
        index: 0,
        total,
        item: (items as unknown[])[0],
      } : undefined,
    };

    // Publish success status
    await publishNodeStatus(publish, nodeId, "success", NodeType.LOOP);

    // Return the context with loop data
    // The workflow engine will handle the actual iteration
    return {
      ...context,
      [`${nodeName}`]: {
        items,
        total,
        mode,
        results: [], // Will be populated during iterations
        // Provide initial iteration context
        $item: items.length > 0 ? (items as unknown[])[0] : undefined,
        $index: 0,
        $total: total,
      },
      __branchDecision: branchDecision,
      // Mark this as a loop node for special handling
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
  } catch (error) {
    // Publish error status
    await publishNodeStatus(publish, nodeId, "error", NodeType.LOOP);
    throw error;
  }
};
