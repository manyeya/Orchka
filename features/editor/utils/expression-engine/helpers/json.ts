
import { registerHelper, SafeString } from '..';

// ============================================================================
// JSON Helpers
// ============================================================================

/**
 * Stringify to JSON
 * Usage: {{ $stringify data }}
 */
registerHelper('$stringify', function (data: unknown) {
    try {
        return new SafeString(JSON.stringify(data, null, 2));
    } catch {
        return '';
    }
});

/**
 * Parse JSON string
 * Usage: {{ $parse jsonString }}
 */
registerHelper('$parse', function (str: string) {
    if (typeof str !== 'string') return str;
    try {
        return JSON.parse(str);
    } catch {
        return undefined;
    }
});

/**
 * Deep merge objects
 * Usage: {{ $merge obj1 obj2 }}
 */
registerHelper('$merge', function (...objects: unknown[]) {
    // Filter out Handlebars options object
    const objs = objects.filter(obj => obj && typeof obj === 'object' && !Array.isArray(obj));
    return Object.assign({}, ...objs);
});

/**
 * Pick specific keys from object
 * Usage: {{ $pick obj "name" "email" }}
 */
registerHelper('$pick', function (obj: Record<string, unknown>, ...keys: unknown[]) {
    if (!obj || typeof obj !== 'object') return {};
    const keyStrings = keys.filter(k => typeof k === 'string') as string[];
    const result: Record<string, unknown> = {};
    for (const key of keyStrings) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
});

/**
 * Omit specific keys from object
 * Usage: {{ $omit obj "password" }}
 */
registerHelper('$omit', function (obj: Record<string, unknown>, ...keys: unknown[]) {
    if (!obj || typeof obj !== 'object') return {};
    const keyStrings = keys.filter(k => typeof k === 'string') as string[];
    const result: Record<string, unknown> = { ...obj };
    for (const key of keyStrings) {
        delete result[key];
    }
    return result;
});