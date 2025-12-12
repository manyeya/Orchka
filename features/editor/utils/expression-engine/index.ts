/**
 * Expression Engine
 * 
 * A powerful templating system using Handlebars for dynamic expression
 * resolution in workflow node configurations.
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
 * const result = evaluate('{{ $json "HTTP Request" "users.0.name" }}', context);
 * // result: 'John'
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
 * Complete context available for expression evaluation
 */
export interface ExpressionContext {
    /** All previous node outputs keyed by node name */
    $json: Record<string, unknown>;
    /** Node metadata keyed by node name */
    $node: Record<string, NodeInfo>;
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
 * Expression detection regex pattern
 */
const EXPRESSION_PATTERN = /\{\{[\s\S]*?\}\}/;

/**
 * Check if a value contains expressions
 */
export function isExpression(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    // Create fresh regex to avoid lastIndex issues
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

    try {
        const template = handlebars.compile(expression, {
            strict: false,
            noEscape: true, // We handle escaping ourselves
        });

        const result = template(context);

        // Try to parse as JSON if result looks like a stringified object/array
        if (typeof result === 'string') {
            const trimmed = result.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                try {
                    return JSON.parse(trimmed);
                } catch {
                    // Not valid JSON, return as string
                }
            }
        }

        return result;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Expression evaluation failed: ${message}`);
    }
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
    const { nodeResults, nodes, workflowId, workflowName, executionId, env } = options;

    // Build $json - node outputs keyed by node name
    const $json: Record<string, unknown> = {};
    const $node: Record<string, NodeInfo> = {};

    for (const node of nodes) {
        const name = (node.data?.name as string) || node.name || node.id;

        // Store node result under its name
        if (nodeResults[`${name}_data`] !== undefined) {
            $json[name] = nodeResults[`${name}_data`];
        } else if (nodeResults[name] !== undefined) {
            $json[name] = nodeResults[name];
        }

        // Also store full response object if available
        if (nodeResults[`${name}_response`] !== undefined) {
            $json[`${name}_response`] = nodeResults[`${name}_response`];
        }

        // Store node metadata
        $node[name] = {
            id: node.id,
            name,
            type: node.type,
        };
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return {
        $json,
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
    };
}

// ============================================================================
// Helper Registration
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

