// ============================================================================
// Data Helpers
// ============================================================================

import { registerHelper } from "..";

/**
 * Access node output by name and optional path
 * Usage: {{ $json "HTTP Request" "data.users" }}
 */
registerHelper('$json', function (nodeName: string, path?: string) {
    // @ts-expect-error - Handlebars context
    const context = this;
    const nodeData = context.$json?.[nodeName];

    if (!nodeData) return undefined;
    if (!path || typeof path !== 'string') return nodeData;

    // Navigate path
    const parts = path.split('.');
    let result: unknown = nodeData;

    for (const part of parts) {
        if (result === null || result === undefined) return undefined;
        if (typeof result === 'object') {
            result = (result as Record<string, unknown>)[part];
        } else {
            return undefined;
        }
    }

    return result;
});

/**
 * Access node metadata
 * Usage: {{ $node "HTTP Request" "name" }}
 */
registerHelper('$node', function (nodeName: string, property?: string) {
    // @ts-expect-error - Handlebars context
    const context = this;
    const node = context.$node?.[nodeName];

    if (!node) return undefined;
    if (!property) return node;

    return node[property as keyof typeof node];
});

/**
 * Get first item from array
 * Usage: {{ $first items }}
 */
registerHelper('$first', function (arr: unknown[]) {
    if (!Array.isArray(arr)) return undefined;
    return arr[0];
});

/**
 * Get last item from array
 * Usage: {{ $last items }}
 */
registerHelper('$last', function (arr: unknown[]) {
    if (!Array.isArray(arr)) return undefined;
    return arr[arr.length - 1];
});

/**
 * Get property with default value
 * Usage: {{ $get user "email" "N/A" }}
 */
registerHelper('$get', function (obj: Record<string, unknown>, key: string, defaultValue?: unknown) {
    if (!obj || typeof obj !== 'object') return defaultValue;
    const value = obj[key];
    return value !== undefined ? value : defaultValue;
});

/**
 * Get object keys
 * Usage: {{ $keys data }}
 */
registerHelper('$keys', function (obj: Record<string, unknown>) {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj);
});

/**
 * Get object values
 * Usage: {{ $values data }}
 */
registerHelper('$values', function (obj: Record<string, unknown>) {
    if (!obj || typeof obj !== 'object') return [];
    return Object.values(obj);
});

/**
 * Get length of array or string
 * Usage: {{ $length items }}
 */
registerHelper('$length', function (value: unknown[] | string) {
    if (Array.isArray(value) || typeof value === 'string') {
        return value.length;
    }
    return 0;
});
