// ============================================================================
// Math Helpers
// ============================================================================

import { registerHelper } from "..";

/**
 * Addition
 * Usage: {{ $add a b }}
 */
registerHelper('$add', function (a: number, b: number) {
    return Number(a) + Number(b);
});

/**
 * Subtraction
 * Usage: {{ $subtract total discount }}
 */
registerHelper('$subtract', function (a: number, b: number) {
    return Number(a) - Number(b);
});

/**
 * Multiplication
 * Usage: {{ $multiply price quantity }}
 */
registerHelper('$multiply', function (a: number, b: number) {
    return Number(a) * Number(b);
});

/**
 * Division
 * Usage: {{ $divide total count }}
 */
registerHelper('$divide', function (a: number, b: number) {
    const divisor = Number(b);
    if (divisor === 0) return 0;
    return Number(a) / divisor;
});

/**
 * Modulo
 * Usage: {{ $mod n 2 }}
 */
registerHelper('$mod', function (a: number, b: number) {
    return Number(a) % Number(b);
});

/**
 * Round number to decimal places
 * Usage: {{ $round price 2 }}
 */
registerHelper('$round', function (num: number, decimals?: number) {
    const d = decimals ?? 0;
    const factor = Math.pow(10, d);
    return Math.round(Number(num) * factor) / factor;
});

/**
 * Floor value
 * Usage: {{ $floor value }}
 */
registerHelper('$floor', function (num: number) {
    return Math.floor(Number(num));
});

/**
 * Ceiling value
 * Usage: {{ $ceil value }}
 */
registerHelper('$ceil', function (num: number) {
    return Math.ceil(Number(num));
});

/**
 * Absolute value
 * Usage: {{ $abs difference }}
 */
registerHelper('$abs', function (num: number) {
    return Math.abs(Number(num));
});

/**
 * Minimum value
 * Usage: {{ $min a b c }}
 */
registerHelper('$min', function (...args: unknown[]) {
    // Filter out Handlebars options object
    const nums = args.filter(arg => typeof arg === 'number' || typeof arg === 'string');
    return Math.min(...nums.map(Number));
});

/**
 * Maximum value
 * Usage: {{ $max a b c }}
 */
registerHelper('$max', function (...args: unknown[]) {
    const nums = args.filter(arg => typeof arg === 'number' || typeof arg === 'string');
    return Math.max(...nums.map(Number));
});

/**
 * Sum of array
 * Usage: {{ $sum prices }}
 */
registerHelper('$sum', function (arr: number[]) {
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((sum, num) => sum + Number(num), 0);
});

/**
 * Average of array
 * Usage: {{ $avg scores }}
 */
registerHelper('$avg', function (arr: number[]) {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    const sum = arr.reduce((s, num) => s + Number(num), 0);
    return sum / arr.length;
});