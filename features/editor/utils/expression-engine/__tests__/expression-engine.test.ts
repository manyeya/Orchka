/**
 * Expression Engine Tests
 * 
 * Tests for the Handlebars-based expression engine.
 * Run with: bun test lib/expression-engine
 */

import { describe, expect, test } from 'bun:test';
import {
    evaluate,
    evaluateObject,
    isExpression,
    extractExpressions,
    createExpressionContext,
    ExpressionContext
} from '@/features/editor/utils/expression-engine';
import '@/features/editor/utils/expression-engine/helpers'; // Register helpers

describe('Expression Engine', () => {
    // Sample context for testing
    function createTestContext(): ExpressionContext {
        return createExpressionContext({
            nodeResults: {
                'HTTP Request_data': { users: [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }] },
                'Config_data': { apiUrl: 'https://api.example.com', timeout: 5000 },
            },
            nodes: [
                { id: '1', type: 'HTTP_REQUEST', data: { name: 'HTTP Request' } },
                { id: '2', type: 'MANUAL_TRIGGER', data: { name: 'Config' } },
            ],
            workflowId: 'wf-123',
            workflowName: 'Test Workflow',
            executionId: 'exec-456',
        });
    }

    describe('isExpression', () => {
        test('detects expressions', () => {
            expect(isExpression('{{ name }}')).toBe(true);
            expect(isExpression('Hello {{ name }}')).toBe(true);
            expect(isExpression('{{ $json "Node" "path" }}')).toBe(true);
        });

        test('returns false for non-expressions', () => {
            expect(isExpression('Hello world')).toBe(false);
            expect(isExpression('')).toBe(false);
            expect(isExpression(123 as any)).toBe(false);
            expect(isExpression(null as any)).toBe(false);
        });
    });

    describe('extractExpressions', () => {
        test('extracts all expressions', () => {
            const result = extractExpressions('{{ a }} and {{ b }}');
            expect(result).toEqual(['{{ a }}', '{{ b }}']);
        });

        test('returns empty array for no expressions', () => {
            expect(extractExpressions('Hello world')).toEqual([]);
        });
    });

    describe('evaluate', () => {
        test('evaluates workflow context variables', () => {
            const context = createTestContext();
            // Access workflow info directly
            const result = evaluate('{{ $workflow.id }}', context);
            expect(result).toBe('wf-123');
        });

        test('evaluates today variable', () => {
            const context = createTestContext();
            const result = evaluate('{{ $today }}', context);
            expect(typeof result).toBe('string');
        });

        test('returns non-expression strings as-is', () => {
            const context = createTestContext();
            expect(evaluate('Hello world', context)).toBe('Hello world');
        });

        test('evaluates $json helper for node data access', () => {
            const context = createTestContext();
            const result = evaluate('{{ $json "Config" "apiUrl" }}', context);
            expect(result).toBe('https://api.example.com');
        });

        test('handles string concatenation in templates', () => {
            const context = createTestContext();
            const result = evaluate('URL: {{ $json "Config" "apiUrl" }}/users', context);
            expect(result).toBe('URL: https://api.example.com/users');
        });
    });

    describe('evaluateObject', () => {
        test('recursively evaluates object', () => {
            const context = createTestContext();
            const obj = {
                baseUrl: '{{ $json "Config" "apiUrl" }}',
                simple: 'static value'
            };

            const result = evaluateObject(obj, context);
            expect(result.baseUrl).toBe('https://api.example.com');
            expect(result.simple).toBe('static value');
        });

        test('handles arrays', () => {
            const context = createTestContext();
            const arr = ['{{ $workflow.id }}', 'static'];
            const result = evaluateObject(arr, context);
            expect(result[0]).toBe('wf-123');
            expect(result[1]).toBe('static');
        });

        test('preserves non-expression values', () => {
            const context = createTestContext();
            const obj = {
                number: 42,
                boolean: true,
                string: 'hello'
            };
            const result = evaluateObject(obj, context);
            expect(result.number).toBe(42);
            expect(result.boolean).toBe(true);
            expect(result.string).toBe('hello');
        });
    });

    describe('Helpers - via context', () => {
        // Note: Handlebars helpers return strings when used in templates
        // These tests verify the helpers are registered and callable

        test('$json helper retrieves node data', () => {
            const context = createTestContext();
            const result = evaluate('{{ $json "Config" "apiUrl" }}', context);
            expect(result).toBe('https://api.example.com');
        });

        test('$json helper with nested path', () => {
            const context = createTestContext();
            const result = evaluate('{{ $json "HTTP Request" "users.0.name" }}', context);
            expect(result).toBe('John');
        });

        test('$workflow context access', () => {
            const context = createTestContext();
            expect(evaluate('{{ $workflow.name }}', context)).toBe('Test Workflow');
            expect(evaluate('{{ $execution.id }}', context)).toBe('exec-456');
        });

        test('built-in #if helper works', () => {
            const context = createTestContext();
            // Handlebars built-in #if block helper
            const result = evaluate('{{#if $workflow.id}}yes{{else}}no{{/if}}', context);
            expect(result).toBe('yes');
        });

        test('built-in #each helper works', () => {
            const context = createTestContext() as any;
            // Add array to context for testing
            context.items = ['a', 'b', 'c'];
            const result = evaluate('{{#each items}}{{this}}{{/each}}', context);
            expect(result).toBe('abc');
        });
    });

    describe('Date context variables', () => {
        const context = createTestContext();

        test('$now is a Date object', () => {
            expect(context.$now instanceof Date).toBe(true);
        });

        test('$today is a date string', () => {
            expect(context.$today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('createExpressionContext', () => {
        test('builds context with $json for node outputs', () => {
            const context = createTestContext();
            expect(context.$json['Config']).toEqual({ apiUrl: 'https://api.example.com', timeout: 5000 });
        });

        test('builds context with $node metadata', () => {
            const context = createTestContext();
            expect(context.$node['HTTP Request']).toEqual({
                id: '1',
                name: 'HTTP Request',
                type: 'HTTP_REQUEST'
            });
        });

        test('builds context with $workflow info', () => {
            const context = createTestContext();
            expect(context.$workflow.id).toBe('wf-123');
            expect(context.$workflow.name).toBe('Test Workflow');
        });

        test('builds context with $execution info', () => {
            const context = createTestContext();
            expect(context.$execution.id).toBe('exec-456');
            expect(context.$execution.startedAt instanceof Date).toBe(true);
        });
    });
});
