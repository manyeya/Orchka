
// ============================================================================
// Date Helpers
// ============================================================================

import { registerHelper } from "..";

/**
 * Current timestamp
 * Usage: {{ $now }}
 */
registerHelper('$now', function () {
    return new Date().toISOString();
});

/**
 * Today's date
 * Usage: {{ $today }}
 */
registerHelper('$today', function () {
    return new Date().toISOString().split('T')[0];
});

/**
 * Format date
 * Usage: {{ $formatDate date "YYYY-MM-DD" }}
 */
registerHelper('$formatDate', function (date: string | Date, format?: string) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';

    const fmt = format || 'YYYY-MM-DD';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return fmt
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
});

/**
 * Parse date string to ISO
 * Usage: {{ $parseDate "2024-01-01" }}
 */
registerHelper('$parseDate', function (dateStr: string) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString();
});

/**
 * Add days to date
 * Usage: {{ $addDays date 7 }}
 */
registerHelper('$addDays', function (date: string | Date, days: number) {
    const d = date instanceof Date ? new Date(date) : new Date(date);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + Number(days));
    return d.toISOString();
});

/**
 * Add hours to date
 * Usage: {{ $addHours date 24 }}
 */
registerHelper('$addHours', function (date: string | Date, hours: number) {
    const d = date instanceof Date ? new Date(date) : new Date(date);
    if (isNaN(d.getTime())) return '';
    d.setHours(d.getHours() + Number(hours));
    return d.toISOString();
});

/**
 * Days between dates
 * Usage: {{ $diffDays start end }}
 */
registerHelper('$diffDays', function (start: string | Date, end: string | Date) {
    const d1 = start instanceof Date ? start : new Date(start);
    const d2 = end instanceof Date ? end : new Date(end);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Check if date1 is after date2
 * Usage: {{ $isAfter date1 date2 }}
 */
registerHelper('$isAfter', function (date1: string | Date, date2: string | Date) {
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : new Date(date2);
    return d1.getTime() > d2.getTime();
});

/**
 * Check if date1 is before date2
 * Usage: {{ $isBefore date1 date2 }}
 */
registerHelper('$isBefore', function (date1: string | Date, date2: string | Date) {
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : new Date(date2);
    return d1.getTime() < d2.getTime();
});