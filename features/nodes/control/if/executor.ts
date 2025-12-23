import { NodeType } from "@/features/nodes/types";
import { logger } from "@/lib/logger";
import type { NodeExecutor, WorkflowContext, BranchDecision } from "../../utils/execution/types";
import { publishNodeStatus } from "../../utils/realtime";
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
 * 
 * @param condition - The condition expression to evaluate (may already be resolved)
 * @param expressionContext - The expression context for evaluation
 * @returns Promise resolving to boolean result of the condition evaluation
 */
export async function evaluateIfCondition(
  condition: unknown,
  expressionContext: ExpressionContext
): Promise<boolean> {
  // Handle null/undefined conditions
  if (condition === null || condition === undefined) {
    logger.warn("If Node: Empty condition, treating as false");
    return false;
  }

  // If condition is already a boolean (pre-resolved), return it directly
  if (typeof condition === "boolean") {
    return condition;
  }

  // If condition is a number, use truthy conversion
  if (typeof condition === "number") {
    return condition !== 0;
  }

  // If condition is not a string, convert to boolean
  if (typeof condition !== "string") {
    return Boolean(condition);
  }

  // Empty string condition evaluates to false
  if (condition.trim() === "") {
    logger.warn("If Node: Empty condition, treating as false");
    return false;
  }

  try {
    const result = await evaluate(condition, expressionContext);

    // Convert result to boolean
    // Explicit boolean values
    if (typeof result === "boolean") {
      return result;
    }

    // String "true"/"false"
    if (typeof result === "string") {
      const lower = result.toLowerCase().trim();
      if (lower === "true") return true;
      if (lower === "false") return false;
    }

    // Truthy/falsy conversion for other types
    return Boolean(result);
  } catch (error) {
    logger.warn({ err: error }, "If Node: Error evaluating condition, treating as false");
    return false;
  }
}

/**
 * If Node Executor
 * 
 * Evaluates a condition expression and returns a branch decision
 * indicating whether to follow the "true" or "false" branch.
 * 
 * Requirements:
 * - 1.3: Use expression engine to resolve condition to boolean
 * - 1.4: Execute "true" branch when condition is true
 * - 1.5: Execute "false" branch when condition is false
 * - 1.6: Treat empty/invalid conditions as false
 * - 1.7: Publish status updates via realtime channel
 */
export const ifNodeExecutor: NodeExecutor<IfNodeData> = async ({
  data,
  nodeId,
  context,
  step,
  expressionContext,
  publish,
}): Promise<WorkflowContext> => {
  // Publish loading status
  await publishNodeStatus(publish, nodeId, "loading", NodeType.IF_CONDITION);

  const nodeName = data.name || "If";
  const stepName = `${nodeName} (${nodeId})`;

  try {
    // Execute condition evaluation within a step for durability
    const result = await step.run(stepName, async (): Promise<IfNodeResult> => {
      // Ensure we have an expression context
      if (!expressionContext) {
        logger.warn("If Node: No expression context provided, treating condition as false");
        return {
          context,
          branchDecision: {
            branch: "false",
            data: { conditionResult: false, reason: "no_expression_context" },
          },
        };
      }

      // Evaluate the condition (may already be resolved by resolveNodeExpressions)
      const conditionResult = await evaluateIfCondition(data.condition as unknown, expressionContext);

      // Determine which branch to take
      const branch = conditionResult ? "true" : "false";

      return {
        context,
        branchDecision: {
          branch,
          data: { conditionResult },
        },
      };
    });

    // Publish success status
    await publishNodeStatus(publish, nodeId, "success", NodeType.IF_CONDITION);

    // Extract condition result from the step result
    const conditionResult = (result.branchDecision.data as { conditionResult?: boolean })?.conditionResult;

    // Return the context following the standard structure: { [nodeName]: { branch, condition, result } }
    // IMPORTANT: Spread context FIRST, then set __branchDecision to ensure it's not overwritten
    return {
      ...context,
      [`${nodeName}`]: {
        branch: result.branchDecision.branch,
        condition: data.condition,
        result: conditionResult,
      },
      __branchDecision: result.branchDecision,
    };
  } catch (error) {
    // Publish error status
    await publishNodeStatus(publish, nodeId, "error", NodeType.IF_CONDITION);
    throw error;
  }
};
