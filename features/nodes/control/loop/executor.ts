import { NodeType } from "@/lib/generated/prisma/enums";
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
    console.warn("Loop Node: Empty array expression, returning empty array");
    return [];
  }

  // If expression is already an array (pre-resolved), return it
  if (Array.isArray(expression)) {
    return expression;
  }

  // If expression is not a string, wrap it in an array
  if (typeof expression !== "string") {
    console.warn("Loop Node: Array expression resolved to non-array value, wrapping in array");
    return [expression];
  }

  // Empty string expression returns empty array
  if (expression.trim() === "") {
    console.warn("Loop Node: Empty array expression, returning empty array");
    return [];
  }

  let result: unknown;
  try {
    result = await evaluate(expression, expressionContext);
  } catch (error) {
    console.warn("Loop Node: Error evaluating array expression, returning empty array:", error);
    return [];
  }

  // If result is already an array, return it
  if (Array.isArray(result)) {
    return result;
  }

  // If result is null or undefined, return empty array
  if (result === null || result === undefined) {
    console.warn("Loop Node: Array expression resolved to null/undefined, returning empty array");
    return [];
  }

  // Wrap non-array values in a single-element array
  console.warn("Loop Node: Array expression resolved to non-array value, wrapping in array");
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
    console.warn("Loop Node: Invalid count, returning empty array");
    return [];
  }
  return Array.from({ length: count }, (_, i) => i);
}

/**
 * Loop Node Executor
 * 
 * Iterates over an array or a specified number of times, executing
 * the loop body for each iteration. Uses Inngest step.run for each
 * iteration to ensure durability and proper state management.
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
    // Determine the items to iterate over
    let items: unknown[];

    if (data.mode === "array") {
      // Array mode: evaluate the array expression
      if (!expressionContext) {
        console.warn("Loop Node: No expression context provided, using empty array");
        items = [];
      } else {
        items = await evaluateLoopArray(data.arrayExpression as unknown, expressionContext);
      }
    } else {
      // Count mode: generate array of indices
      items = generateCountArray(data.count || 0);
    }

    const total = items.length;
    const results: unknown[] = [];

    // Execute each iteration using step.run for durability
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const iterationStepName = `${stepName} - iteration ${index + 1}/${total}`;

      const iterationResult = await step.run(iterationStepName, async () => {
        // Create iteration context
        const iterationContext: LoopIterationContext = {
          $item: item,
          $index: index,
          $total: total,
        };

        return {
          item,
          index,
          total,
          iterationContext,
        };
      });

      results.push(iterationResult);
    }

    // Build the branch decision
    const branchDecision: BranchDecision = {
      branch: "done",
      data: {
        results,
        total,
        mode: data.mode,
      },
    };

    // Publish success status
    await publishNodeStatus(publish, nodeId, "success", NodeType.LOOP);

    // Return the context following the standard structure: { [nodeName]: { results, total, mode, $item, $index, $total } }
    return {

      [`${nodeName}`]: {
        results,
        total,
        mode: data.mode,
        // Provide iteration context for downstream nodes
        $item: items[items.length - 1], // Last item
        $index: items.length - 1, // Last index
        $total: total,
      },
      // __branchDecision: branchDecision,
      ...context,
    };
  } catch (error) {
    // Publish error status
    await publishNodeStatus(publish, nodeId, "error", NodeType.LOOP);
    throw error;
  }
};
