import { describe, it, expect, beforeEach } from "vitest";
import {
  evaluate,
  evaluateObject,
  createExpressionContext,
  isExpression,
  ExpressionError,
  clearExpressionCache,
  type ExpressionContext,
} from "./index";

describe("Expression Engine - JSONata Implementation", () => {
  let context: ExpressionContext;

  beforeEach(() => {
    clearExpressionCache();
    context = createExpressionContext({
      nodeResults: {
        "HTTP Request": { users: [{ name: "John", age: 30 }], count: 1 },
        "Transform": { processed: true },
      },
      nodes: [
        { id: "1", name: "HTTP Request", type: "HTTP_REQUEST" },
        { id: "2", name: "Transform", type: "TRANSFORM" },
      ],
      workflowId: "wf-123",
      workflowName: "Test Workflow",
      executionId: "ex-456",
      env: { API_KEY: "secret123" },
    });
  });

  describe("isExpression", () => {
    it("should detect expressions with {{ }}", () => {
      expect(isExpression("{{ input.name }}")).toBe(true);
      expect(isExpression("Hello {{ input.name }}")).toBe(true);
      expect(isExpression("plain text")).toBe(false);
      expect(isExpression(123)).toBe(false);
      expect(isExpression(null)).toBe(false);
    });

    it("should detect expressions with ={{ }}", () => {
      expect(isExpression("={{ input.name }}")).toBe(true);
      expect(isExpression("={{ $uppercase(input.name) }}")).toBe(true);
    });
  });

  describe("evaluate", () => {
    it("should return non-expression strings as-is", async () => {
      const result = await evaluate("plain text", context);
      expect(result).toBe("plain text");
    });

    it("should return non-string values as-is", async () => {
      expect(await evaluate(123 as unknown as string, context)).toBe(123);
      expect(await evaluate(null as unknown as string, context)).toBe(null);
    });

    it("should evaluate simple path expressions", async () => {
      context.$input = { name: "John", age: 30 };
      const result = await evaluate("{{ input.name }}", context);
      expect(result).toBe("John");
    });

    it("should evaluate ={{ }} expressions", async () => {
      context.$input = { name: "John", age: 30 };
      const result = await evaluate("={{ input.name }}", context);
      expect(result).toBe("John");
    });

    it("should evaluate expressions with functions", async () => {
      context.$input = { name: "john" };
      const result = await evaluate("={{ $uppercase(input.name) }}", context);
      expect(result).toBe("JOHN");
    });

    it("should evaluate array access", async () => {
      context.$input = { items: ["a", "b", "c"] };
      const result = await evaluate("{{ input.items[0] }}", context);
      expect(result).toBe("a");
    });

    it("should evaluate nested path expressions", async () => {
      context.$input = { user: { profile: { name: "John" } } };
      const result = await evaluate("{{ input.user.profile.name }}", context);
      expect(result).toBe("John");
    });

    it("should return undefined for missing paths", async () => {
      context.$input = { name: "John" };
      const result = await evaluate("{{ input.missing.path }}", context);
      expect(result).toBeUndefined();
    });

    it("should evaluate JSONata functions", async () => {
      context.$input = { name: "john" };
      const result = await evaluate("{{ $uppercase(input.name) }}", context);
      expect(result).toBe("JOHN");
    });

    it("should preserve native types for single expressions", async () => {
      context.$input = { count: 42, active: true, items: [1, 2, 3] };

      expect(await evaluate("{{ input.count }}", context)).toBe(42);
      expect(await evaluate("{{ input.active }}", context)).toBe(true);
      expect(await evaluate("{{ input.items }}", context)).toEqual([1, 2, 3]);
    });

    it("should concatenate mixed text and expressions", async () => {
      context.$input = { name: "John", age: 30 };
      const result = await evaluate("Hello {{ input.name }}, you are {{ input.age }} years old", context);
      expect(result).toBe("Hello John, you are 30 years old");
    });

    it("should handle empty expressions", async () => {
      const result = await evaluate("{{  }}", context);
      expect(result).toBe("");
    });

    it("should access workflow metadata", async () => {
      const result = await evaluate("{{ workflow.id }}", context);
      expect(result).toBe("wf-123");
    });

    it("should access execution metadata", async () => {
      const result = await evaluate("{{ execution.id }}", context);
      expect(result).toBe("ex-456");
    });

    it("should access environment variables", async () => {
      const result = await evaluate("{{ env.API_KEY }}", context);
      expect(result).toBe("secret123");
    });

    it("should access $node function", async () => {
      const result = await evaluate('{{ $node("HTTP Request").users[0].name }}', context);
      expect(result).toBe("John");
    });

    it("should return undefined for non-existent nodes", async () => {
      const result = await evaluate('{{ $node("NonExistent") }}', context);
      expect(result).toBeUndefined();
    });
  });

  describe("evaluateObject", () => {
    it("should recursively evaluate expressions in objects", async () => {
      context.$input = { name: "John", url: "https://api.example.com" };

      const obj = {
        greeting: "Hello {{ input.name }}",
        config: {
          endpoint: "{{ input.url }}/users",
        },
      };

      const result = await evaluateObject(obj, context);
      expect(result).toEqual({
        greeting: "Hello John",
        config: {
          endpoint: "https://api.example.com/users",
        },
      });
    });

    it("should recursively evaluate expressions in arrays", async () => {
      context.$input = { items: ["a", "b", "c"] };

      const arr = ["{{ input.items[0] }}", "{{ input.items[1] }}", "static"];
      const result = await evaluateObject(arr, context);
      expect(result).toEqual(["a", "b", "static"]);
    });

    it("should preserve non-string values", async () => {
      const obj = {
        count: 42,
        active: true,
        name: "{{ input.name }}",
      };
      context.$input = { name: "John" };

      const result = await evaluateObject(obj, context);
      expect(result).toEqual({
        count: 42,
        active: true,
        name: "John",
      });
    });

    it("should handle null and undefined", async () => {
      expect(await evaluateObject(null, context)).toBeNull();
      expect(await evaluateObject(undefined, context)).toBeUndefined();
    });
  });

  describe("createExpressionContext", () => {
    it("should create context with workflow metadata", () => {
      const ctx = createExpressionContext({
        nodeResults: {},
        nodes: [],
        workflowId: "wf-test",
        workflowName: "Test",
        executionId: "ex-test",
      });

      expect(ctx.$workflow.id).toBe("wf-test");
      expect(ctx.$workflow.name).toBe("Test");
      expect(ctx.$execution.id).toBe("ex-test");
    });

    it("should create $node function that returns node data", () => {
      const ctx = createExpressionContext({
        nodeResults: { "Node1": { data: "test" } },
        nodes: [{ id: "1", name: "Node1", type: "TEST" }],
        workflowId: "wf-test",
        executionId: "ex-test",
      });

      expect(ctx.$node("Node1")).toEqual({ data: "test" });
      expect(ctx.$node("NonExistent")).toBeUndefined();
    });

    it("should include environment variables", () => {
      const ctx = createExpressionContext({
        nodeResults: {},
        nodes: [],
        workflowId: "wf-test",
        executionId: "ex-test",
        env: { SECRET: "value" },
      });

      expect(ctx.$env.SECRET).toBe("value");
    });

    it("should include $now and $today", () => {
      const ctx = createExpressionContext({
        nodeResults: {},
        nodes: [],
        workflowId: "wf-test",
        executionId: "ex-test",
      });

      expect(typeof ctx.$now).toBe("number");
      expect(ctx.$today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("ExpressionError", () => {
    it("should include expression and position in error", async () => {
      try {
        // Invalid JSONata syntax
        await evaluate("{{ input. }}", context);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ExpressionError);
        expect((error as ExpressionError).expression).toBe("input.");
      }
    });
  });

  describe("comparison operators", () => {
    it("should evaluate equality (=)", async () => {
      context.$input = { value: 5 };
      expect(await evaluate("{{ input.value = 5 }}", context)).toBe(true);
      expect(await evaluate("{{ input.value = 10 }}", context)).toBe(false);
    });

    it("should evaluate inequality (!=)", async () => {
      context.$input = { value: 5 };
      expect(await evaluate("{{ input.value != 10 }}", context)).toBe(true);
      expect(await evaluate("{{ input.value != 5 }}", context)).toBe(false);
    });

    it("should evaluate less than (<)", async () => {
      context.$input = { value: 5 };
      expect(await evaluate("{{ input.value < 10 }}", context)).toBe(true);
      expect(await evaluate("{{ input.value < 5 }}", context)).toBe(false);
      expect(await evaluate("{{ input.value < 3 }}", context)).toBe(false);
    });

    it("should evaluate greater than (>)", async () => {
      context.$input = { value: 5 };
      expect(await evaluate("{{ input.value > 3 }}", context)).toBe(true);
      expect(await evaluate("{{ input.value > 5 }}", context)).toBe(false);
      expect(await evaluate("{{ input.value > 10 }}", context)).toBe(false);
    });

    it("should evaluate less than or equal (<=)", async () => {
      context.$input = { value: 5 };
      expect(await evaluate("{{ input.value <= 10 }}", context)).toBe(true);
      expect(await evaluate("{{ input.value <= 5 }}", context)).toBe(true);
      expect(await evaluate("{{ input.value <= 3 }}", context)).toBe(false);
    });

    it("should evaluate greater than or equal (>=)", async () => {
      context.$input = { value: 5 };
      expect(await evaluate("{{ input.value >= 3 }}", context)).toBe(true);
      expect(await evaluate("{{ input.value >= 5 }}", context)).toBe(true);
      expect(await evaluate("{{ input.value >= 10 }}", context)).toBe(false);
    });
  });

  describe("logical operators", () => {
    it("should evaluate 'and'", async () => {
      context.$input = { a: true, b: false };
      expect(await evaluate("{{ input.a and input.b }}", context)).toBe(false);
      expect(await evaluate("{{ input.a and true }}", context)).toBe(true);
      expect(await evaluate("{{ true and true }}", context)).toBe(true);
      expect(await evaluate("{{ false and false }}", context)).toBe(false);
    });

    it("should evaluate 'or'", async () => {
      context.$input = { a: true, b: false };
      expect(await evaluate("{{ input.a or input.b }}", context)).toBe(true);
      expect(await evaluate("{{ false or false }}", context)).toBe(false);
      expect(await evaluate("{{ false or true }}", context)).toBe(true);
    });

    it("should evaluate 'not'", async () => {
      context.$input = { a: true, b: false };
      expect(await evaluate("{{ $not(input.a) }}", context)).toBe(false);
      expect(await evaluate("{{ $not(input.b) }}", context)).toBe(true);
      expect(await evaluate("{{ $not(true) }}", context)).toBe(false);
      expect(await evaluate("{{ $not(false) }}", context)).toBe(true);
    });
  });

  describe("ternary operator", () => {
    it("should select correct branch", async () => {
      context.$input = { condition: true };
      expect(await evaluate('{{ input.condition ? "yes" : "no" }}', context)).toBe("yes");

      context.$input = { condition: false };
      expect(await evaluate('{{ input.condition ? "yes" : "no" }}', context)).toBe("no");
    });

    it("should work with comparison expressions as condition", async () => {
      context.$input = { value: 10 };
      expect(await evaluate('{{ input.value > 5 ? "big" : "small" }}', context)).toBe("big");
      expect(await evaluate('{{ input.value < 5 ? "small" : "big" }}', context)).toBe("big");
    });

    it("should return non-string values", async () => {
      context.$input = { flag: true };
      expect(await evaluate("{{ input.flag ? 100 : 0 }}", context)).toBe(100);
      expect(await evaluate("{{ input.flag ? [1,2,3] : [] }}", context)).toEqual([1, 2, 3]);
    });
  });

  describe("in operator", () => {
    it("should check array membership", async () => {
      context.$input = { items: ["apple", "banana", "cherry"] };
      expect(await evaluate('{{ "apple" in input.items }}', context)).toBe(true);
      expect(await evaluate('{{ "orange" in input.items }}', context)).toBe(false);
    });

    it("should work with numeric arrays", async () => {
      context.$input = { numbers: [1, 2, 3, 4, 5] };
      expect(await evaluate("{{ 3 in input.numbers }}", context)).toBe(true);
      expect(await evaluate("{{ 10 in input.numbers }}", context)).toBe(false);
    });

    it("should work with dynamic values", async () => {
      context.$input = { search: "banana", items: ["apple", "banana", "cherry"] };
      expect(await evaluate("{{ input.search in input.items }}", context)).toBe(true);
    });
  });

  describe("$branch binding", () => {
    it("should access $branch.last when branch decision exists", async () => {
      const ctx = createExpressionContext({
        nodeResults: {
          __lastBranchDecision: { branch: "true", data: { matched: true } },
          __branchDecisions: {
            "node-1": { branch: "true", data: { matched: true } },
          },
        },
        nodes: [],
        workflowId: "wf-test",
        executionId: "ex-test",
      });

      const result = await evaluate("{{ branch.last.branch }}", ctx);
      expect(result).toBe("true");
    });

    it("should access $branch.last.data when present", async () => {
      const ctx = createExpressionContext({
        nodeResults: {
          __lastBranchDecision: { branch: "case-1", data: { value: 42 } },
          __branchDecisions: {},
        },
        nodes: [],
        workflowId: "wf-test",
        executionId: "ex-test",
      });

      const result = await evaluate("{{ branch.last.data.value }}", ctx);
      expect(result).toBe(42);
    });

    it("should access $branch.all by node ID", async () => {
      const ctx = createExpressionContext({
        nodeResults: {
          __branchDecisions: {
            "if-node-1": { branch: "true", data: { condition: "met" } },
            "switch-node-2": { branch: "case-2", data: { selected: "option2" } },
          },
        },
        nodes: [],
        workflowId: "wf-test",
        executionId: "ex-test",
      });

      const result1 = await evaluate('{{ branch.all."if-node-1".branch }}', ctx);
      expect(result1).toBe("true");

      const result2 = await evaluate('{{ branch.all."switch-node-2".branch }}', ctx);
      expect(result2).toBe("case-2");
    });

    it("should return undefined for $branch.last when no branch decisions exist", async () => {
      const ctx = createExpressionContext({
        nodeResults: {},
        nodes: [],
        workflowId: "wf-test",
        executionId: "ex-test",
      });

      const result = await evaluate("{{ branch.last }}", ctx);
      expect(result).toBeUndefined();
    });

    it("should access iteration info from loop branch decisions", async () => {
      const ctx = createExpressionContext({
        nodeResults: {
          __lastBranchDecision: {
            branch: "loop-body",
            iteration: { index: 2, total: 5, item: { id: "item-3" } },
          },
          __branchDecisions: {},
        },
        nodes: [],
        workflowId: "wf-test",
        executionId: "ex-test",
      });

      expect(await evaluate("{{ branch.last.iteration.index }}", ctx)).toBe(2);
      expect(await evaluate("{{ branch.last.iteration.total }}", ctx)).toBe(5);
      expect(await evaluate("{{ branch.last.iteration.item.id }}", ctx)).toBe("item-3");
    });
  });

  describe("built-in string functions", () => {
    it("should evaluate $uppercase", async () => {
      context.$input = { text: "hello world" };
      const result = await evaluate("{{ $uppercase(input.text) }}", context);
      expect(result).toBe("HELLO WORLD");
    });

    it("should evaluate $lowercase", async () => {
      context.$input = { text: "HELLO WORLD" };
      const result = await evaluate("{{ $lowercase(input.text) }}", context);
      expect(result).toBe("hello world");
    });

    it("should evaluate $trim", async () => {
      context.$input = { text: "  hello world  " };
      const result = await evaluate("{{ $trim(input.text) }}", context);
      expect(result).toBe("hello world");
    });

    it("should evaluate $substring", async () => {
      context.$input = { text: "hello world" };
      // $substring(string, start, length)
      expect(await evaluate("{{ $substring(input.text, 0, 5) }}", context)).toBe("hello");
      expect(await evaluate("{{ $substring(input.text, 6) }}", context)).toBe("world");
    });

    it("should evaluate $replace", async () => {
      context.$input = { text: "hello world" };
      const result = await evaluate('{{ $replace(input.text, "world", "JSONata") }}', context);
      expect(result).toBe("hello JSONata");
    });

    it("should evaluate $split", async () => {
      context.$input = { text: "a,b,c,d" };
      const result = await evaluate('{{ $split(input.text, ",") }}', context);
      expect(result).toEqual(["a", "b", "c", "d"]);
    });

    it("should evaluate $join", async () => {
      context.$input = { items: ["a", "b", "c"] };
      const result = await evaluate('{{ $join(input.items, "-") }}', context);
      expect(result).toBe("a-b-c");
    });
  });

  describe("built-in math functions", () => {
    it("should evaluate $sum", async () => {
      context.$input = { numbers: [1, 2, 3, 4, 5] };
      const result = await evaluate("{{ $sum(input.numbers) }}", context);
      expect(result).toBe(15);
    });

    it("should evaluate $average", async () => {
      context.$input = { numbers: [10, 20, 30] };
      const result = await evaluate("{{ $average(input.numbers) }}", context);
      expect(result).toBe(20);
    });

    it("should evaluate $min", async () => {
      context.$input = { numbers: [5, 2, 8, 1, 9] };
      const result = await evaluate("{{ $min(input.numbers) }}", context);
      expect(result).toBe(1);
    });

    it("should evaluate $max", async () => {
      context.$input = { numbers: [5, 2, 8, 1, 9] };
      const result = await evaluate("{{ $max(input.numbers) }}", context);
      expect(result).toBe(9);
    });

    it("should evaluate $round", async () => {
      context.$input = { value: 3.7 };
      expect(await evaluate("{{ $round(input.value) }}", context)).toBe(4);
      expect(await evaluate("{{ $round(3.14159, 2) }}", context)).toBe(3.14);
    });

    it("should evaluate $floor", async () => {
      context.$input = { value: 3.9 };
      const result = await evaluate("{{ $floor(input.value) }}", context);
      expect(result).toBe(3);
    });

    it("should evaluate $ceil", async () => {
      context.$input = { value: 3.1 };
      const result = await evaluate("{{ $ceil(input.value) }}", context);
      expect(result).toBe(4);
    });

    it("should evaluate $abs", async () => {
      context.$input = { value: -42 };
      const result = await evaluate("{{ $abs(input.value) }}", context);
      expect(result).toBe(42);
    });
  });

  describe("built-in array functions", () => {
    it("should evaluate $count", async () => {
      context.$input = { items: [1, 2, 3, 4, 5] };
      const result = await evaluate("{{ $count(input.items) }}", context);
      expect(result).toBe(5);
    });

    it("should evaluate $append", async () => {
      context.$input = { arr1: [1, 2], arr2: [3, 4] };
      const result = await evaluate("{{ $append(input.arr1, input.arr2) }}", context);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("should evaluate $sort", async () => {
      context.$input = { items: [3, 1, 4, 1, 5, 9, 2, 6] };
      const result = await evaluate("{{ $sort(input.items) }}", context);
      expect(result).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
    });

    it("should evaluate $reverse", async () => {
      context.$input = { items: [1, 2, 3, 4, 5] };
      const result = await evaluate("{{ $reverse(input.items) }}", context);
      expect(result).toEqual([5, 4, 3, 2, 1]);
    });

    it("should evaluate $filter", async () => {
      context.$input = { numbers: [1, 2, 3, 4, 5, 6] };
      // Filter numbers greater than 3
      const result = await evaluate("{{ $filter(input.numbers, function($v) { $v > 3 }) }}", context);
      // JSONata returns sequences, check array contents
      expect(Array.from(result as unknown[])).toEqual([4, 5, 6]);
    });

    it("should evaluate $map", async () => {
      context.$input = { numbers: [1, 2, 3] };
      // Double each number
      const result = await evaluate("{{ $map(input.numbers, function($v) { $v * 2 }) }}", context);
      // JSONata returns sequences, check array contents
      expect(Array.from(result as unknown[])).toEqual([2, 4, 6]);
    });
  });

  describe("built-in date functions", () => {
    it("should evaluate $millis for current timestamp", async () => {
      // JSONata's $millis() returns current timestamp in milliseconds
      const before = Date.now();
      const result = await evaluate("{{ $millis() }}", context);
      const after = Date.now();

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });

    it("should access context now binding", async () => {
      // The context's now is a timestamp number set when context was created
      const result = await evaluate("{{ now }}", context);

      expect(typeof result).toBe("number");
      // The now value should be a recent timestamp (within last minute)
      const oneMinuteAgo = Date.now() - 60000;
      expect(result).toBeGreaterThanOrEqual(oneMinuteAgo);
      expect(result).toBeLessThanOrEqual(Date.now());
    });

    it("should evaluate $toMillis", async () => {
      // ISO date string to milliseconds
      const result = await evaluate('{{ $toMillis("2024-01-15T12:00:00Z") }}', context);
      expect(result).toBe(1705320000000);
    });

    it("should evaluate $fromMillis", async () => {
      // Milliseconds to ISO date string
      const result = await evaluate("{{ $fromMillis(1705320000000) }}", context);
      expect(result).toBe("2024-01-15T12:00:00.000Z");
    });
  });

  describe("$input resolution", () => {
    it("should use previous node data when currentNodeId is provided", () => {
      const ctx = createExpressionContext({
        nodeResults: {
          "Node 1": { out: "v1" },
          "Node 2": { out: "v2" },
          "Node 3": { out: "v3" },
        },
        nodes: [
          { id: "n1", name: "Node 1", type: "ACTION" },
          { id: "n2", name: "Node 2", type: "ACTION" },
          { id: "n3", name: "Node 3", type: "ACTION" },
        ],
        workflowId: "wf-123",
        executionId: "ex-456",
        currentNodeId: "n3", // Current is n3, input should be n2
      });

      expect(ctx.$input).toEqual({ out: "v2" });
    });

    it("should use fallback to last non-internal node data when currentNodeId is missing", () => {
      const ctx = createExpressionContext({
        nodeResults: {
          "Node 1": { out: "v1" },
          "Node 2": { out: "v2" },
          "__branchDecisions": { some: "data" },
        },
        nodes: [
          { id: "n1", name: "Node 1", type: "ACTION" },
          { id: "n2", name: "Node 2", type: "ACTION" },
        ],
        workflowId: "wf-123",
        executionId: "ex-456",
        // currentNodeId is missing
      });

      expect(ctx.$input).toEqual({ out: "v2" });
    });

    it("should return empty object for $input if no nodes have data", () => {
      const ctx = createExpressionContext({
        nodeResults: {},
        nodes: [{ id: "n1", name: "Node 1", type: "ACTION" }],
        workflowId: "wf-123",
        executionId: "ex-456",
      });

      expect(ctx.$input).toEqual({});
    });
  });
});
