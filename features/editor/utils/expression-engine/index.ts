/**
 * Expression Engine - JSONata Implementation
 *
 * A powerful expression evaluation system using JSONata for dynamic value
 * resolution in workflow node configurations.
 *
 * @example
 * ```typescript
 * import { evaluate, createExpressionContext } from '@/features/editor/utils/expression-engine';
 *
 * const context = createExpressionContext({
 *   nodeResults: { 'HTTP Request_data': { users: [{ name: 'John' }] } },
 *   nodes: [{ id: '1', name: 'HTTP Request', type: 'HTTP_REQUEST' }],
 *   workflowId: 'wf-123',
 *   executionId: 'ex-456'
 * });
 *
 * // JSONata expressions (async):
 * const result1 = await evaluate('{{ json.users[0].name }}', context);
 * const result2 = await evaluate('{{ $node("HTTP Request").users[0].name }}', context);
 * const result3 = await evaluate('{{ $uppercase(json.name) }}', context);
 * ```
 */
import jsonata from "jsonata";
import type { Expression } from "jsonata";

// ============================================================================
// Types
// ============================================================================

/**
 * Workflow metadata available in expressions
 */
export interface WorkflowInfo {
  id: string;
  name: string;
}

/**
 * Execution metadata available in expressions
 */
export interface ExecutionInfo {
  id: string;
  startedAt: Date;
}

/**
 * Branch decision information from control nodes
 */
export interface BranchDecisionInfo {
  /** The output handle ID that was taken (e.g., "true", "false", "case-1", "default") */
  branch: string;
  /** Optional data associated with the branch decision */
  data?: unknown;
  /** For loop nodes: iteration context */
  iteration?: {
    index: number;
    total: number;
    item: unknown;
  };
}

/**
 * Complete context available for expression evaluation
 */
export interface ExpressionContext {
  /** Current node's input data (shorthand for most common use case) */
  $json: unknown;
  /** Function to get node data by name: $node("NodeName") */
  $node: (nodeName: string) => unknown;
  /** Workflow metadata */
  $workflow: WorkflowInfo;
  /** Current execution info */
  $execution: ExecutionInfo;
  /** Safe environment variables */
  $env: Record<string, string>;
  /** Current timestamp (milliseconds) */
  $now: number;
  /** Today's date as YYYY-MM-DD */
  $today: string;
  /**
   * Branch decisions from control nodes
   */
  $branch?: {
    /** The most recent branch decision */
    last?: BranchDecisionInfo;
    /** All branch decisions keyed by control node ID */
    all: Record<string, BranchDecisionInfo>;
  };
}

/**
 * Options for creating expression context
 */
export interface CreateContextOptions {
  nodeResults: Record<string, unknown>;
  nodes: Array<{
    id: string;
    name?: string;
    type: string;
    data?: Record<string, unknown>;
  }>;
  workflowId: string;
  workflowName?: string;
  executionId: string;
  env?: Record<string, string>;
  /** The current node being executed - used to determine $json value */
  currentNodeId?: string;
}

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Custom error class for expression evaluation errors
 * Includes position information when available from JSONata
 */
export class ExpressionError extends Error {
  constructor(
    message: string,
    public readonly expression: string,
    public readonly position?: number
  ) {
    super(message);
    this.name = "ExpressionError";
  }
}

// ============================================================================
// Expression Cache
// ============================================================================

/**
 * Cache for compiled JSONata expressions to improve performance
 */
const expressionCache = new Map<string, Expression>();

/**
 * Get or compile a JSONata expression with caching
 */
function getCompiledExpression(expr: string): Expression {
  let compiled = expressionCache.get(expr);
  if (!compiled) {
    compiled = jsonata(expr);
    expressionCache.set(expr, compiled);
  }
  return compiled;
}

/**
 * Clear the expression cache (useful for testing)
 */
export function clearExpressionCache(): void {
  expressionCache.clear();
}

// ============================================================================
// Core Expression Engine
// ============================================================================

/**
 * Expression detection regex pattern - matches {{ ... }} or ={{ ... }}
 */
const EXPRESSION_PATTERN = /=?\{\{[\s\S]*?\}\}/;

/**
 * Single expression pattern - matches entire string being just {{ ... }}
 * Also handles ={{ ... }} pattern (n8n style) for compatibility
 */
const SINGLE_EXPRESSION_PATTERN = /^=?\{\{\s*([\s\S]+?)\s*\}\}$/;

/**
 * Pattern to find all expressions in a string (handles ={{ }} too)
 */
const ALL_EXPRESSIONS_PATTERN = /=?\{\{\s*([\s\S]*?)\s*\}\}/g;

/**
 * Check if a value contains expressions
 */
export function isExpression(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return EXPRESSION_PATTERN.test(value);
}

/**
 * Extract all expressions from a string
 */
export function extractExpressions(value: string): string[] {
  const globalRegex = new RegExp(EXPRESSION_PATTERN, "g");
  const matches = value.match(globalRegex);
  return matches || [];
}

/**
 * Evaluate a JSONata expression with the given context (async)
 */
async function evaluateJsonata(
  expr: string,
  context: ExpressionContext
): Promise<unknown> {
  try {
    const compiled = getCompiledExpression(expr);

    // Register custom $node function
    compiled.registerFunction("node", (name: string) => {
      return context.$node(name);
    });

    // Create the evaluation context - JSONata accesses these as top-level variables
    const evalContext = {
      json: context.$json,
      workflow: context.$workflow,
      execution: context.$execution,
      env: context.$env,
      now: context.$now,
      today: context.$today,
      branch: context.$branch,
    };

    // Evaluate with bindings for $ prefixed access
    const result = await compiled.evaluate(evalContext, {
      json: context.$json,
      node: context.$node,
      workflow: context.$workflow,
      execution: context.$execution,
      env: context.$env,
      now: context.$now,
      today: context.$today,
      branch: context.$branch,
    });

    return result;
  } catch (error: unknown) {
    // JSONata errors have position information
    if (error && typeof error === "object" && "position" in error) {
      const jsonataError = error as { position?: number; message?: string };
      throw new ExpressionError(
        `Expression error at position ${jsonataError.position}: ${jsonataError.message}`,
        expr,
        jsonataError.position
      );
    }
    if (error instanceof Error) {
      throw new ExpressionError(
        `Expression evaluation failed: ${error.message}`,
        expr
      );
    }
    throw new ExpressionError(
      `Expression evaluation failed: Unknown error`,
      expr
    );
  }
}

/**
 * Evaluate a single expression string (async)
 * @param expression - The expression to evaluate (with or without {{ }})
 * @param context - The expression context
 * @returns Promise resolving to the evaluated result
 */
export async function evaluate(
  expression: string,
  context: ExpressionContext
): Promise<unknown> {
  if (!expression || typeof expression !== "string") {
    return expression;
  }

  // If no expressions found, return as-is
  if (!isExpression(expression)) {
    return expression;
  }

  const trimmed = expression.trim();

  // Check if the entire string is a single expression
  const singleExprMatch = trimmed.match(SINGLE_EXPRESSION_PATTERN);

  if (singleExprMatch) {
    const innerExpr = singleExprMatch[1].trim();

    // Empty expression returns empty string
    if (!innerExpr) {
      return "";
    }

    // Evaluate and return native type
    return evaluateJsonata(innerExpr, context);
  }

  // Multiple expressions or mixed content - find all expressions and evaluate them
  const matches: Array<{ fullMatch: string; innerExpr: string; index: number }> = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(ALL_EXPRESSIONS_PATTERN);
  
  while ((match = regex.exec(expression)) !== null) {
    matches.push({
      fullMatch: match[0],
      innerExpr: match[1].trim(),
      index: match.index,
    });
  }

  // Evaluate all expressions in parallel
  const evaluatedValues = await Promise.all(
    matches.map(async (m) => {
      if (!m.innerExpr) {
        return { ...m, value: "" };
      }
      try {
        const value = await evaluateJsonata(m.innerExpr, context);
        // Convert result to string for interpolation
        if (value === null || value === undefined) {
          return { ...m, value: "" };
        }
        if (typeof value === "object") {
          return { ...m, value: JSON.stringify(value) };
        }
        return { ...m, value: String(value) };
      } catch {
        // On error in mixed content, return empty string for that expression
        return { ...m, value: "" };
      }
    })
  );

  // Replace expressions with their evaluated values
  let result = expression;
  // Process in reverse order to maintain correct indices
  for (let i = evaluatedValues.length - 1; i >= 0; i--) {
    const { fullMatch, value } = evaluatedValues[i];
    result = result.replace(fullMatch, value);
  }

  return result;
}

/**
 * Recursively evaluate all expressions in an object (async)
 * @param obj - Object containing potential expressions
 * @param context - The expression context
 * @param visited - Set of visited objects to prevent circular reference loops
 * @returns Promise resolving to object with all expressions evaluated
 */
export async function evaluateObject<T>(
  obj: T,
  context: ExpressionContext,
  visited: WeakSet<object> = new WeakSet()
): Promise<T> {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return (await evaluate(obj, context)) as T;
  }

  if (Array.isArray(obj)) {
    const results = await Promise.all(
      obj.map((item) => evaluateObject(item, context, visited))
    );
    return results as T;
  }

  if (typeof obj === "object") {
    // Check for circular references
    if (visited.has(obj)) {
      return obj;
    }
    visited.add(obj);

    const result: Record<string, unknown> = {};
    const entries = Object.entries(obj);
    const evaluatedEntries = await Promise.all(
      entries.map(async ([key, value]) => {
        const evaluatedValue = await evaluateObject(value, context, visited);
        return [key, evaluatedValue] as const;
      })
    );
    
    for (const [key, value] of evaluatedEntries) {
      result[key] = value;
    }
    return result as T;
  }

  // Non-string primitives (numbers, booleans) are returned unchanged
  return obj;
}

/**
 * Create an expression context from workflow execution data
 */
export function createExpressionContext(
  options: CreateContextOptions
): ExpressionContext {
  const {
    nodeResults,
    nodes,
    workflowId,
    workflowName,
    executionId,
    env,
    currentNodeId,
  } = options;

  // Build node data keyed by node name
  const nodeDataByName: Record<string, unknown> = {};

  for (const node of nodes) {
    const name = (node.data?.name as string) || node.name || node.id;

    // Get node result - try multiple key formats
    let nodeData: unknown = undefined;
    if (nodeResults[`${name}_data`] !== undefined) {
      nodeData = nodeResults[`${name}_data`];
    } else if (nodeResults[name] !== undefined) {
      nodeData = nodeResults[name];
    }

    nodeDataByName[name] = nodeData;
  }

  // Determine $json - the previous node's output or current input
  let $json: unknown = {};

  if (currentNodeId) {
    const currentNodeIndex = nodes.findIndex((n) => n.id === currentNodeId);
    if (currentNodeIndex > 0) {
      const prevNode = nodes[currentNodeIndex - 1];
      const prevName =
        (prevNode.data?.name as string) || prevNode.name || prevNode.id;
      $json = nodeDataByName[prevName] || {};
    }
  } else {
    // Use the last executed node's data
    const lastResultKey = Object.keys(nodeResults).pop();
    if (lastResultKey) {
      $json = nodeResults[lastResultKey] || {};
    }
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Create the $node function for node lookups
  const $node = (nodeName: string): unknown => {
    return nodeDataByName[nodeName];
  };

  // Extract branch decisions from nodeResults if present
  const branchDecisions =
    (nodeResults.__branchDecisions as Record<string, BranchDecisionInfo>) || {};
  const lastBranchDecision = nodeResults.__lastBranchDecision as
    | BranchDecisionInfo
    | undefined;

  return {
    $json,
    $node,
    $workflow: {
      id: workflowId,
      name: workflowName || "Untitled Workflow",
    },
    $execution: {
      id: executionId,
      startedAt: now,
    },
    $env: env || {},
    $now: now.getTime(),
    $today: today,
    $branch: {
      last: lastBranchDecision,
      all: branchDecisions,
    },
  };
}

// ============================================================================
// Helper list (for documentation/reference)
// ============================================================================

/**
 * Available JSONata built-in functions organized by category
 * These are provided by JSONata and don't need custom registration
 */
export const helpers = {
  string: [
    "$string",
    "$length",
    "$substring",
    "$substringBefore",
    "$substringAfter",
    "$uppercase",
    "$lowercase",
    "$trim",
    "$pad",
    "$contains",
    "$split",
    "$join",
    "$match",
    "$replace",
    "$base64encode",
    "$base64decode",
  ],
  math: [
    "$number",
    "$abs",
    "$floor",
    "$ceil",
    "$round",
    "$power",
    "$sqrt",
    "$random",
    "$sum",
    "$max",
    "$min",
    "$average",
  ],
  array: [
    "$count",
    "$append",
    "$sort",
    "$reverse",
    "$shuffle",
    "$distinct",
    "$zip",
  ],
  object: ["$keys", "$values", "$spread", "$merge", "$each", "$sift"],
  date: ["$now", "$millis", "$toMillis", "$fromMillis"],
  logic: ["$boolean", "$not", "$exists", "$type"],
  higher_order: ["$map", "$filter", "$reduce", "$sift", "$each"],
};
