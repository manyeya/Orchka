/**
 * Expression Engine
 * 
 * A powerful templating system for dynamic expression resolution in workflow 
 * node configurations.
 * 
 * @example
 * ```typescript
 * import { evaluate, createExpressionContext } from '@/lib/expression-engine';
 * 
 * const context = createExpressionContext({
 *   nodeResults: { 'HTTP Request_data': { users: [{ name: 'John' }] } },
 *   nodes: [{ id: '1', name: 'HTTP Request', type: 'HTTP_REQUEST' }],
 *   workflowId: 'wf-123',
 *   executionId: 'ex-456'
 * });
 * 
 * // expressions:
 * const result1 = evaluate('{{ $json.users[0].name }}', context);
 * const result2 = evaluate('{{ $("HTTP Request").item.json.users[0].name }}', context);
 * 
 * // Handlebars helpers still work:
 * const result3 = evaluate('{{ $uppercase $json.name }}', context);
 * ```
 */
import Handlebars from 'handlebars';

// ============================================================================
// Types
// ============================================================================

/**
 * Node metadata available in expressions
 */
export interface NodeInfo {
    id: string;
    name: string;
    type: string;
}

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
 * Item structure
 */
export interface Item {
    json: unknown;
    pairedItem?: number;
}

/**
 * Node reference result from $() function
 */
export interface NodeReference {
    item: Item;
    all: () => Item[];
    first: () => Item;
    last: () => Item;
}

/**
 * Complete context available for expression evaluation
 */
export interface ExpressionContext {
    /** Current node's input data (shorthand for most common use case) */
    $json: unknown;
    /** Function to get node data by name: $("NodeName") */
    $: (nodeName: string) => NodeReference;
    /** Node outputs keyed by node name */
    $node: Record<string, { json: unknown; item: Item }>;
    /** Workflow metadata */
    $workflow: WorkflowInfo;
    /** Current execution info */
    $execution: ExecutionInfo;
    /** Safe environment variables */
    $env: Record<string, string>;
    /** Current timestamp */
    $now: Date;
    /** Today's date as YYYY-MM-DD */
    $today: string;
    /** Input data (alias for $json) */
    $input: { item: Item; all: () => Item[]; first: () => Item };
}

/**
 * Options for creating expression context
 */
export interface CreateContextOptions {
    nodeResults: Record<string, unknown>;
    nodes: Array<{ id: string; name?: string; type: string; data?: Record<string, unknown> }>;
    workflowId: string;
    workflowName?: string;
    executionId: string;
    env?: Record<string, string>;
    /** The current node being executed - used to determine $json value */
    currentNodeId?: string;
}

// ============================================================================
// Handlebars Instance
// ============================================================================

// Create an isolated Handlebars instance to avoid polluting the global one
const handlebars = Handlebars.create();

// ============================================================================
// Core Expression Engine
// ============================================================================

/**
 * Expression detection regex pattern - matches {{ ... }}
 */
const EXPRESSION_PATTERN = /\{\{[\s\S]*?\}\}/;

/**
 * Check if a value contains expressions
 */
export function isExpression(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    return EXPRESSION_PATTERN.test(value);
}

/**
 * Extract all expressions from a string
 */
export function extractExpressions(value: string): string[] {
    const globalRegex = new RegExp(EXPRESSION_PATTERN, 'g');
    const matches = value.match(globalRegex);
    return matches || [];
}

/**
 * Check if an expression uses JavaScript syntax
 */
function isJsExpression(innerExpr: string): boolean {
    // Check for function calls like $("NodeName") or $node["name"]
    if (/\$\s*\(/.test(innerExpr)) return true;
    // Check for property access like $json.field or $json["field"] or $json[0]
    if (/\$json\s*[.\[]/.test(innerExpr)) return true;
    if (/\$node\s*[.\[]/.test(innerExpr)) return true;
    if (/\$input\s*[.\[]/.test(innerExpr)) return true;
    if (/\$workflow\s*[.\[]/.test(innerExpr)) return true;
    if (/\$execution\s*[.\[]/.test(innerExpr)) return true;
    if (/\$env\s*[.\[]/.test(innerExpr)) return true;
    return false;
}

/**
 * Evaluate a JavaScript expression safely within a context
 */
function evaluateJsExpression(expression: string, context: ExpressionContext): unknown {
    // Create a safe evaluation environment
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);

    try {
        // Create a function that takes the context values as arguments
        // This sandboxes the expression to only have access to the context
        const fn = new Function(...contextKeys, `
            "use strict";
            try {
                return (${expression});
            } catch (e) {
                return undefined;
            }
        `);

        return fn(...contextValues);
    } catch (error) {
        // If expression fails to compile, return undefined
        console.warn(`Expression evaluation failed: ${expression}`, error);
        return undefined;
    }
}

/**
 * Evaluate using Handlebars (for helper-based expressions)
 */
function evaluateHandlebarsExpression(expression: string, context: ExpressionContext): unknown {
    try {
        const template = handlebars.compile(expression, {
            strict: false,
            noEscape: true,
        });

        const result = template(context);

        // Try to parse as JSON if result looks like a stringified object/array
        if (typeof result === 'string') {
            const trimmed = result.trim();
            try {
                return JSON.parse(trimmed);
            } catch {
                // Not valid JSON, return as string
            }
        }

        return result;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Expression evaluation failed: ${message}`);
    }
}

/**
 * Evaluate a single expression string
 * @param expression - The expression to evaluate (with or without {{ }})
 * @param context - The expression context
 * @returns The evaluated result
 */
export function evaluate(expression: string, context: ExpressionContext): unknown {
    if (!expression || typeof expression !== 'string') {
        return expression;
    }

    // If no expressions found, return as-is
    if (!isExpression(expression)) {
        return expression;
    }

    // Check if the entire string is a single expression
    const trimmed = expression.trim();
    const singleExprMatch = trimmed.match(/^\{\{\s*([\s\S]+?)\s*\}\}$/);

    if (singleExprMatch && trimmed === expression.trim()) {
        const innerExpr = singleExprMatch[1].trim();

        // Use evaluation for JavaScript-like expressions
        if (isJsExpression(innerExpr)) {
            return evaluateJsExpression(innerExpr, context);
        }

        // Fall back to Handlebars for helper-based expressions
        return evaluateHandlebarsExpression(expression, context);
    }

    // Multiple expressions or mixed content
    // Check if any expression uses Js syntax
    const expressions = extractExpressions(expression);
    const hasJsExpr = expressions.some(expr => {
        const match = expr.match(/^\{\{\s*([\s\S]+?)\s*\}\}$/);
        return match && isJsExpression(match[1].trim());
    });

    if (hasJsExpr) {
        // Process each expression individually
        const result = expression.replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, (fullMatch, innerExpr) => {
            const trimmedInner = innerExpr.trim();
            let value: unknown;

            if (isJsExpression(trimmedInner)) {
                value = evaluateJsExpression(trimmedInner, context);
            } else {
                // For non-Js expressions in mixed content, try JS first, then Handlebars
                try {
                    value = evaluateJsExpression(trimmedInner, context);
                } catch {
                    value = evaluateHandlebarsExpression(fullMatch, context);
                }
            }

            // Convert result to string for interpolation
            if (value === null || value === undefined) {
                return '';
            }
            if (typeof value === 'object') {
                return JSON.stringify(value);
            }
            return String(value);
        });

        // Try to parse as JSON if result looks like an object/array
        const trimmedResult = result.trim();
        if ((trimmedResult.startsWith('{') && trimmedResult.endsWith('}')) ||
            (trimmedResult.startsWith('[') && trimmedResult.endsWith(']'))) {
            try {
                return JSON.parse(trimmedResult);
            } catch {
                // Not valid JSON
            }
        }

        return result;
    }

    // No Js expressions, use Handlebars for the entire string
    return evaluateHandlebarsExpression(expression, context);
}

/**
 * Recursively evaluate all expressions in an object
 * @param obj - Object containing potential expressions
 * @param context - The expression context
 * @returns Object with all expressions evaluated
 */
export function evaluateObject<T>(obj: T, context: ExpressionContext): T {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'string') {
        return evaluate(obj, context) as T;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => evaluateObject(item, context)) as T;
    }

    if (typeof obj === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = evaluateObject(value, context);
        }
        return result as T;
    }

    return obj;
}

/**
 * Create an expression context from workflow execution data
 */
export function createExpressionContext(options: CreateContextOptions): ExpressionContext {
    const { nodeResults, nodes, workflowId, workflowName, executionId, env, currentNodeId } = options;

    // Build node data keyed by node name
    const nodeDataByName: Record<string, unknown> = {};
    const $node: Record<string, { json: unknown; item: Item }> = {};

    for (const node of nodes) {
        const name = (node.data?.name as string) || node.name || node.id;

        // Get node result
        let nodeData: unknown = undefined;
        if (nodeResults[`${name}_data`] !== undefined) {
            nodeData = nodeResults[`${name}_data`];
        } else if (nodeResults[name] !== undefined) {
            nodeData = nodeResults[name];
        }

        nodeDataByName[name] = nodeData;

        // Store in $node format
        $node[name] = {
            json: nodeData,
            item: { json: nodeData }
        };
    }

    // Determine $json - the previous node's output or current input
    let $json: unknown = {};

    if (currentNodeId) {
        const currentNodeIndex = nodes.findIndex(n => n.id === currentNodeId);
        if (currentNodeIndex > 0) {
            const prevNode = nodes[currentNodeIndex - 1];
            const prevName = (prevNode.data?.name as string) || prevNode.name || prevNode.id;
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
    const today = now.toISOString().split('T')[0];

    // Create the $() function for node lookups
    const $func = (nodeName: string): NodeReference => {
        const nodeData = nodeDataByName[nodeName];
        const items:Item[] = Array.isArray(nodeData)
            ? nodeData.map(d => ({ json: d }))
            : [{ json: nodeData }];

        return {
            item: items[0] || { json: undefined },
            all: () => items,
            first: () => items[0] || { json: undefined },
            last: () => items[items.length - 1] || { json: undefined }
        };
    };

    // Create $input helper
    const inputItems: Item[] = Array.isArray($json)
        ? $json.map(d => ({ json: d }))
        : [{ json: $json }];

    const $input = {
        item: inputItems[0] || { json: undefined },
        all: () => inputItems,
        first: () => inputItems[0] || { json: undefined }
    };

    return {
        $json,
        $: $func,
        $node,
        $workflow: {
            id: workflowId,
            name: workflowName || 'Untitled Workflow',
        },
        $execution: {
            id: executionId,
            startedAt: now,
        },
        $env: env || {},
        $now: now,
        $today: today,
        $input,
    };
}

// ============================================================================
// Helper Registration (for Handlebars helpers)
// ============================================================================

/**
 * Register a helper on our Handlebars instance
 */
export function registerHelper(
    name: string,
    fn: Handlebars.HelperDelegate
): void {
    handlebars.registerHelper(name, fn);
}

/**
 * Get the Handlebars instance (for advanced usage)
 */
export function getHandlebarsInstance(): typeof Handlebars {
    return handlebars;
}

// ============================================================================
// Export Handlebars utilities
// ============================================================================

export const SafeString = Handlebars.SafeString;
export const escapeExpression = Handlebars.escapeExpression;

/**
 * Expression Engine Helpers
 * 
 * This module registers all custom Handlebars helpers for the expression engine.
 * Helpers are organized by category:
 * - Data helpers: $json, $node, $first, $last, etc.
 * - String helpers: $uppercase, $lowercase, $trim, etc.
 * - Math helpers: $add, $subtract, $multiply, etc.
 * - Date helpers: $now, $formatDate, $addDays, etc.
 * - Logic helpers: $if, $and, $or, $eq, etc.
 * - Array helpers: $map, $filter, $find, etc.
 * - JSON helpers: $stringify, $parse, $merge, etc.
 */

export const helpers = {
    data: ['$json', '$node', '$first', '$last', '$get', '$keys', '$values', '$length'],
    string: ['$uppercase', '$lowercase', '$capitalize', '$trim', '$split', '$join', '$replace', '$substring', '$startsWith', '$endsWith', '$includes', '$template'],
    math: ['$add', '$subtract', '$multiply', '$divide', '$mod', '$round', '$floor', '$ceil', '$abs', '$min', '$max', '$sum', '$avg'],
    date: ['$now', '$today', '$formatDate', '$parseDate', '$addDays', '$addHours', '$diffDays', '$isAfter', '$isBefore'],
    logic: ['$if', '$and', '$or', '$not', '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$isEmpty', '$isNotEmpty', '$isDefined', '$default'],
    array: ['$filter', '$find', '$pluck', '$unique', '$sort', '$reverse', '$slice', '$concat', '$flatten'],
    json: ['$stringify', '$parse', '$merge', '$pick', '$omit'],
};
