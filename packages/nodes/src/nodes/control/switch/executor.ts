import { logger } from "@orchka/nodes/core";
import type { NodeExecutor, WorkflowContext, BranchDecision } from "../../utils/execution/types";
import { evaluate, type ExpressionContext } from "@orchka/expression-engine";
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
 */
export async function evaluateSwitchExpression(
  expression: unknown,
  cases: SwitchCase[],
  expressionContext: ExpressionContext
): Promise<{ branch: string; matchedValue: unknown; evaluatedExpression: unknown }> {
  if (expression === null || expression === undefined) {
    logger.warn("Switch Node: Empty expression, routing to default");
    return { branch: "default", matchedValue: undefined, evaluatedExpression: undefined };
  }

  let evaluatedValue: unknown;

  if (typeof expression !== "string") {
    evaluatedValue = expression;
  } else if (expression.trim() === "") {
    logger.warn("Switch Node: Empty expression, routing to default");
    return { branch: "default", matchedValue: undefined, evaluatedExpression: undefined };
  } else {
    try {
      evaluatedValue = await evaluate(expression, expressionContext);
    } catch (error) {
      logger.warn({ err: error }, "Switch Node: Error evaluating expression, routing to default");
      return { branch: "default", matchedValue: undefined, evaluatedExpression: undefined };
    }
  }

  const stringValue = String(evaluatedValue);

  for (const switchCase of cases) {
    if (switchCase.value === stringValue || switchCase.value === evaluatedValue) {
      return {
        branch: switchCase.id,
        matchedValue: switchCase.value,
        evaluatedExpression: evaluatedValue
      };
    }
  }

  return { branch: "default", matchedValue: undefined, evaluatedExpression: evaluatedValue };
}

/**
 * Switch Node Executor
 * 
 * Evaluates an expression and matches it against defined cases.
 * The orchestrator handles branch routing based on __branchDecision.
 */
export const switchNodeExecutor: NodeExecutor<SwitchNodeData> = async ({
  data,
  nodeId,
  context,
  expressionContext,
}): Promise<WorkflowContext> => {
  const nodeName = data.name || "Switch";

  if (!expressionContext) {
    logger.warn("Switch Node: No expression context provided, routing to default");
    return {
      ...context,
      [nodeName]: {
        branch: "default",
        expression: data.expression,
        value: undefined,
        matchedCase: undefined,
      },
      __branchDecision: {
        branch: "default",
        data: { reason: "no_expression_context" },
      },
    };
  }

  const { branch, matchedValue, evaluatedExpression } = await evaluateSwitchExpression(
    data.expression as unknown,
    data.cases || [],
    expressionContext
  );

  return {
    ...context,
    [nodeName]: {
      branch,
      expression: data.expression,
      value: evaluatedExpression,
      matchedCase: matchedValue,
    },
    __branchDecision: {
      branch,
      data: {
        evaluatedExpression,
        matchedValue,
        casesCount: data.cases?.length || 0,
      },
    },
  };
};
