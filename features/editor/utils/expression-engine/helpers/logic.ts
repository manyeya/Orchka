// ============================================================================
// Logic Helpers
// ============================================================================


import { registerHelper } from "..";

/**
 * Ternary conditional
 * Usage: {{ $if condition "yes" "no" }}
 */
registerHelper('$if', function (condition: unknown, trueValue: unknown, falseValue: unknown) {
    return condition ? trueValue : falseValue;
});

/**
 * Logical AND
 * Usage: {{ $and a b }}
 */
registerHelper('$and', function (a: unknown, b: unknown) {
    return Boolean(a) && Boolean(b);
});

/**
 * Logical OR
 * Usage: {{ $or a b }}
 */
registerHelper('$or', function (a: unknown, b: unknown) {
    return Boolean(a) || Boolean(b);
});

/**
 * Logical NOT
 * Usage: {{ $not value }}
 */
registerHelper('$not', function (value: unknown) {
    return !value;
});

/**
 * Equality check
 * Usage: {{ $eq a b }}
 */
registerHelper('$eq', function (a: unknown, b: unknown) {
    return a === b;
});

/**
 * Not equal check
 * Usage: {{ $ne a b }}
 */
registerHelper('$ne', function (a: unknown, b: unknown) {
    return a !== b;
});

/**
 * Greater than
 * Usage: {{ $gt a b }}
 */
registerHelper('$gt', function (a: number, b: number) {
    return Number(a) > Number(b);
});

/**
 * Greater than or equal
 * Usage: {{ $gte a b }}
 */
registerHelper('$gte', function (a: number, b: number) {
    return Number(a) >= Number(b);
});

/**
 * Less than
 * Usage: {{ $lt a b }}
 */
registerHelper('$lt', function (a: number, b: number) {
    return Number(a) < Number(b);
});

/**
 * Less than or equal
 * Usage: {{ $lte a b }}
 */
registerHelper('$lte', function (a: number, b: number) {
    return Number(a) <= Number(b);
});

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * Usage: {{ $isEmpty value }}
 */
registerHelper('$isEmpty', function (value: unknown) {
    if (value === null || value === undefined || value === '') return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
});

/**
 * Check if value is not empty
 * Usage: {{ $isNotEmpty value }}
 */
registerHelper('$isNotEmpty', function (value: unknown) {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
});

/**
 * Check if value is defined (not null or undefined)
 * Usage: {{ $isDefined value }}
 */
registerHelper('$isDefined', function (value: unknown) {
    return value !== null && value !== undefined;
});

/**
 * Return value or default if falsy
 * Usage: {{ $default value "fallback" }}
 */
registerHelper('$default', function (value: unknown, defaultValue: unknown) {
    return value || defaultValue;
});
