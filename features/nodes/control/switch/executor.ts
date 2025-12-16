import { NodeType } from "@/lib/generated/prisma/enums";
import type { NodeExecutor, WorkflowContext, BranchDecision } from "../../utils/execution/types";
import { publishNodeStatus } from "../../utils/realtime";
import { evaluate, type ExpressionContext } from "@/features/editor/utils/expression-engine";
import type { SwitchNodeData, SwitchCase } from "../types";

/**
 * Result from Switch Node execution including branch decision
 */
export interface SwitchNodeResult {
  context: WorkflowContext;
  branchDecision: BranchDecision;
}

/**
 * Evaluates a switch expression and finds the matching case.
 * Returns the case ID if a match is found, or "default" if no match.
 * 
 * @param expression - The expression to evaluate (may already be resolved)
 * @param cases - The cases to match against
 * @param expressionContext - The expression context for evaluation
 * @returns Promise resolving to the matching case ID or "default"
 */
export async function evaluateSwitchExpression(
  expression: unknown,
  cases: SwitchCase[],
  expressionContext: ExpressionContext
): Promise<{ branch: string; matchedValue: unknown; evaluatedExpression: unknown }> {
  // Handle null/undefined expression
  if (expression === null || expression === undefined) {
    console.warn("Switch Node: Empty expression, routing to default");
    return { branch: "default", matchedValue: undefined, evaluatedExpression: undefined };
  }

  let evaluatedValue: unknown;

  // If expression is already a non-string value (pre-resolved), use it directly
  if (typeof expression !== "string") {
    evaluatedValue = expression;
  } else if (expression.trim() === "") {
    console.warn("Switch Node: Empty expression, routing to default");
    return { branch: "default", matchedValue: undefined, evaluatedExpression: undefined };
  } else {
    try {
      evaluatedValue = await evaluate(expression, expressionContext);
    } catch (error) {
      console.warn("Switch Node: Error evaluating expression, routing to default:", error);
      return { branch: "default", matchedValue: undefined, evaluatedExpression: undefined };
    }
  }

  // Find matching case
  // Convert evaluated value to string for comparison (case values are strings)
  const stringValue = String(evaluatedValue);
  
  for (const switchCase of cases) {
    // Compare both as strings and with loose equality for flexibility
    if (switchCase.value === stringValue || switchCase.value === evaluatedValue) {
      return { 
        branch: switchCase.id, 
        matchedValue: switchCase.value, 
        evaluatedExpression: evaluatedValue 
      };
    }
  }

  // No match found, route to default
  return { branch: "default", matchedValue: undefined, evaluatedExpression: evaluatedValue };
}


/**
 * Switch Node Executor
 * 
 * Evaluates an expression and matches it against defined cases,
 * returning a branch decision indicating which case to follow.
 * If no case matches, routes to the "default" branch.
 * 
 * Requirements:
 * - 2.3: Use expression engine to resolve the value
 * - 2.4: Execute matching case's output handle when value matches
 * - 2.5: Execute "default" output handle when no case matches
 * - 2.7: Publish status updates via realtime channel
 */
export const switchNodeExecutor: NodeExecutor<SwitchNodeData> = async ({
  data,
  nodeId,
  context,
  step,
  expressionContext,
  publish,
}): Promise<WorkflowContext> => {
  // Publish loading status
  await publishNodeStatus(publish, nodeId, "loading", NodeType.SWITCH);

  const nodeName = data.name || "Switch";
  const stepName = `${nodeName} (${nodeId})`;

  try {
    // Execute switch evaluation within a step for durability
    const result = await step.run(stepName, async (): Promise<SwitchNodeResult> => {
      // Ensure we have an expression context
      if (!expressionContext) {
        console.warn("Switch Node: No expression context provided, routing to default");
        return {
          context,
          branchDecision: {
            branch: "default",
            data: { reason: "no_expression_context" },
          },
        };
      }

      // Evaluate the expression and find matching case (may already be resolved)
      const { branch, matchedValue, evaluatedExpression } = await evaluateSwitchExpression(
        data.expression as unknown,
        data.cases || [],
        expressionContext
      );

      return {
        context,
        branchDecision: {
          branch,
          data: { 
            evaluatedExpression, 
            matchedValue,
            casesCount: data.cases?.length || 0,
          },
        },
      };
    });

    // Publish success status
    await publishNodeStatus(publish, nodeId, "success", NodeType.SWITCH);

    // Extract values from the step result
    const branchData = result.branchDecision.data as { 
      evaluatedExpression?: unknown; 
      matchedValue?: unknown;
    } | undefined;

    // Return the context following the standard structure: { [nodeName]: { branch, expression, value, matchedCase } }
    return {
      [`${nodeName}`]: {
        branch: result.branchDecision.branch,
        expression: data.expression,
        value: branchData?.evaluatedExpression,
        matchedCase: branchData?.matchedValue,
      },
      // __branchDecision: result.branchDecision,
        ...context,
    };
  } catch (error) {
    // Publish error status
    await publishNodeStatus(publish, nodeId, "error", NodeType.SWITCH);
    throw error;
  }
};
