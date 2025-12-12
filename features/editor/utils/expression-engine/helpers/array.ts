// ============================================================================
// Array Helpers
// ============================================================================

import { registerHelper } from "..";

/**
 * Filter array by property value
 * Usage: {{ $filter users "active" true }}
 */
registerHelper('$filter', function (arr: Record<string, unknown>[], key: string, value: unknown) {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => item && item[key] === value);
});

/**
 * Find item in array by property value
 * Usage: {{ $find users "id" 123 }}
 */
registerHelper('$find', function (arr: Record<string, unknown>[], key: string, value: unknown) {
    if (!Array.isArray(arr)) return undefined;
    return arr.find(item => item && item[key] === value);
});

/**
 * Extract property from each item
 * Usage: {{ $pluck users "email" }}
 */
registerHelper('$pluck', function (arr: Record<string, unknown>[], key: string) {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => item?.[key]);
});

/**
 * Get unique values
 * Usage: {{ $unique items }}
 */
registerHelper('$unique', function (arr: unknown[]) {
    if (!Array.isArray(arr)) return [];
    return [...new Set(arr)];
});

/**
 * Sort array by property
 * Usage: {{ $sort users "name" }}
 */
registerHelper('$sort', function (arr: Record<string, unknown>[], key?: string) {
    if (!Array.isArray(arr)) return [];
    const sorted = [...arr];

    if (key) {
        sorted.sort((a, b) => {
            const aVal = a?.[key];
            const bVal = b?.[key];
            // Convert to string for comparison to handle unknown types
            const aStr = String(aVal ?? '');
            const bStr = String(bVal ?? '');
            if (aStr < bStr) return -1;
            if (aStr > bStr) return 1;
            return 0;
        });
    } else {
        sorted.sort();
    }

    return sorted;
});

/**
 * Reverse array
 * Usage: {{ $reverse items }}
 */
registerHelper('$reverse', function (arr: unknown[]) {
    if (!Array.isArray(arr)) return [];
    return [...arr].reverse();
});

/**
 * Slice array
 * Usage: {{ $slice items 0 5 }}
 */
registerHelper('$slice', function (arr: unknown[], start: number, end?: number) {
    if (!Array.isArray(arr)) return [];
    return arr.slice(start, end);
});

/**
 * Concatenate arrays
 * Usage: {{ $concat arr1 arr2 }}
 */
registerHelper('$concat', function (...arrays: unknown[]) {
    // Filter out Handlebars options object
    const arrs = arrays.filter(Array.isArray);
    return arrs.flat();
});

/**
 * Flatten nested array
 * Usage: {{ $flatten nested }}
 */
registerHelper('$flatten', function (arr: unknown[], depth?: number) {
    if (!Array.isArray(arr)) return [];
    return arr.flat(depth ?? 1);
});