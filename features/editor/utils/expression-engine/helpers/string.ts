// ============================================================================
// String Helpers
// ============================================================================

import { registerHelper } from "..";

/**
 * Convert to uppercase
 * Usage: {{ $uppercase name }}
 */
registerHelper('$uppercase', function (str: string) {
    if (typeof str !== 'string') return str;
    return str.toUpperCase();
});

/**
 * Convert to lowercase
 * Usage: {{ $lowercase email }}
 */
registerHelper('$lowercase', function (str: string) {
    if (typeof str !== 'string') return str;
    return str.toLowerCase();
});

/**
 * Capitalize first letter
 * Usage: {{ $capitalize title }}
 */
registerHelper('$capitalize', function (str: string) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
});

/**
 * Trim whitespace
 * Usage: {{ $trim input }}
 */
registerHelper('$trim', function (str: string) {
    if (typeof str !== 'string') return str;
    return str.trim();
});

/**
 * Split string to array
 * Usage: {{ $split text "," }}
 */
registerHelper('$split', function (str: string, separator: string) {
    if (typeof str !== 'string') return [];
    return str.split(separator || ',');
});

/**
 * Join array to string
 * Usage: {{ $join items ", " }}
 */
registerHelper('$join', function (arr: unknown[], separator: string) {
    if (!Array.isArray(arr)) return '';
    return arr.join(separator || ',');
});

/**
 * Replace text
 * Usage: {{ $replace text "old" "new" }}
 */
registerHelper('$replace', function (str: string, search: string, replace: string) {
    if (typeof str !== 'string') return str;
    return str.split(search).join(replace);
});

/**
 * Extract substring
 * Usage: {{ $substring text 0 10 }}
 */
registerHelper('$substring', function (str: string, start: number, end?: number) {
    if (typeof str !== 'string') return str;
    return str.substring(start, end);
});

/**
 * Check if string starts with prefix
 * Usage: {{ $startsWith text "http" }}
 */
registerHelper('$startsWith', function (str: string, prefix: string) {
    if (typeof str !== 'string') return false;
    return str.startsWith(prefix);
});

/**
 * Check if string ends with suffix
 * Usage: {{ $endsWith file ".json" }}
 */
registerHelper('$endsWith', function (str: string, suffix: string) {
    if (typeof str !== 'string') return false;
    return str.endsWith(suffix);
});

/**
 * Check if string contains substring
 * Usage: {{ $includes text "keyword" }}
 */
registerHelper('$includes', function (str: string, search: string) {
    if (typeof str !== 'string') return false;
    return str.includes(search);
});

/**
 * Simple string interpolation
 * Usage: {{ $template "Hello, {name}!" data }}
 */
registerHelper('$template', function (template: string, data: Record<string, unknown>) {
    if (typeof template !== 'string') return template;
    if (!data || typeof data !== 'object') return template;

    return template.replace(/\{(\w+)\}/g, (_, key) => {
        const value = data[key];
        return value !== undefined ? String(value) : '';
    });
});