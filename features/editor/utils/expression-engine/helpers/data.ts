// ============================================================================
// Data Helpers
// ============================================================================

import { registerHelper } from "..";

// $json and $node helpers removed to allow direct context access via Handlebars standard syntax
// e.g. {{ $json.["Node Name"].data }}

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
