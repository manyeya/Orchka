import {
    ExpressionContext,
    evaluateObject,
    isExpression,
    CreateContextOptions,
    createExpressionContext
} from './expression-engine';

/**
 * Resolve all expressions in node configuration data before execution
 * 
 * This function recursively traverses the node data object and evaluates
 * any JSONata expressions it finds (strings matching {{ ... }}).
 * 
 * @param data - Node configuration with potential expressions
 * @param context - Expression evaluation context with $json, $node, etc.
 * @returns Promise resolving to data with all expressions evaluated
 * 
 * @example
 * ```typescript
 * const nodeData = {
 *   url: '{{ json.apiUrl }}/users',
 *   headers: {
 *     Authorization: 'Bearer {{ json.token }}'
 *   }
 * };
 * 
 * const resolved = await resolveNodeExpressions(nodeData, context);
 * // {
 * //   url: 'https://api.example.com/users',
 * //   headers: {
 * //     Authorization: 'Bearer abc123'
 * //   }
 * // }
 * ```
 */
export async function resolveNodeExpressions<T>(
    data: T,
    context: ExpressionContext
): Promise<T> {
    return evaluateObject(data, context);
}

/**
 * Check if a node's data contains any expressions that need resolution
 * 
 * @param data - Node configuration data
 * @returns true if any string values contain {{ }} expressions
 */
export function hasExpressions(data: unknown): boolean {
    if (data === null || data === undefined) {
        return false;
    }

    if (typeof data === 'string') {
        return isExpression(data);
    }

    if (Array.isArray(data)) {
        return data.some(item => hasExpressions(item));
    }

    if (typeof data === 'object') {
        return Object.values(data).some(value => hasExpressions(value));
    }

    return false;
}

/**
 * Create expression context from workflow execution state
 * 
 * This is a convenience wrapper around createExpressionContext that
 * matches the typical execution parameters.
 * 
 * @param options - Context creation options
 * @returns Expression context for evaluation
 */
export function buildExpressionContext(options: CreateContextOptions): ExpressionContext {
    return createExpressionContext(options);
}

// Re-export types for convenience
export type { ExpressionContext, CreateContextOptions };
