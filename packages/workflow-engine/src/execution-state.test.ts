import { describe, it, expect, beforeEach } from "vitest";
import { ExecutionState, type RedisLike } from "./execution-state";

/**
 * Minimal in-memory Redis fake covering the commands ExecutionState uses, with
 * faithful SADD semantics (returns count of newly-added members) and SET NX.
 */
class FakeRedis implements RedisLike {
  private hashes = new Map<string, Map<string, string>>();
  private sets = new Map<string, Set<string>>();
  private strings = new Map<string, string>();

  async hset(key: string, field: string, value: string) {
    const h = this.hashes.get(key) ?? new Map();
    h.set(field, value);
    this.hashes.set(key, h);
    return 1;
  }
  async hgetall(key: string) {
    return Object.fromEntries(this.hashes.get(key) ?? new Map());
  }
  async sadd(key: string, member: string) {
    const s = this.sets.get(key) ?? new Set<string>();
    const had = s.has(member);
    s.add(member);
    this.sets.set(key, s);
    return had ? 0 : 1;
  }
  async smembers(key: string) {
    return [...(this.sets.get(key) ?? new Set<string>())];
  }
  async set(key: string, value: string, _mode: "NX") {
    if (this.strings.has(key)) return null;
    this.strings.set(key, value);
    return "OK";
  }
  async expire() {
    return 1;
  }
  async del(...keys: string[]) {
    for (const k of keys) {
      this.hashes.delete(k);
      this.sets.delete(k);
      this.strings.delete(k);
    }
    return keys.length;
  }
}

describe("ExecutionState", () => {
  let state: ExecutionState;
  const exec = "exec-1";

  beforeEach(() => {
    state = new ExecutionState(new FakeRedis());
  });

  it("round-trips context including initial data and node outputs", async () => {
    await state.init(exec, { Trigger: { foo: 1 } });
    await state.commitNode(exec, { nodeId: "n1", nodeName: "HTTP", output: { status: 200 } });

    const ctx = await state.getContext(exec);
    expect(ctx).toEqual({ Trigger: { foo: 1 }, HTTP: { status: 200 } });
  });

  it("claimNode returns true exactly once across concurrent parents", async () => {
    const results = await Promise.all([
      state.claimNode(exec, "M"),
      state.claimNode(exec, "M"),
      state.claimNode(exec, "M"),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("makes a node's context visible no later than its completion", async () => {
    await state.commitNode(exec, {
      nodeId: "n1",
      nodeName: "A",
      output: { v: 42 },
    });
    const completed = await state.getCompleted(exec);
    // Invariant: if completed contains the node, context must contain its output.
    expect(completed.has("n1")).toBe(true);
    const ctx = await state.getContext(exec);
    expect(ctx.A).toEqual({ v: 42 });
  });

  it("records branch decisions and skipped nodes", async () => {
    await state.commitNode(exec, {
      nodeId: "if1",
      nodeName: "If",
      output: { branch: "true" },
      branchDecision: { branch: "true", data: {} },
      skippedNodeIds: ["b1", "b2"],
    });

    expect(await state.getBranchDecisions(exec)).toEqual({
      if1: { branch: "true", data: {} },
    });
    expect(await state.getSkipped(exec)).toEqual(new Set(["b1", "b2"]));
  });

  it("tryFinalize succeeds for the first caller only", async () => {
    const a = await state.tryFinalize(exec);
    const b = await state.tryFinalize(exec);
    expect(a).toBe(true);
    expect(b).toBe(false);
  });

  it("clear removes all state", async () => {
    await state.commitNode(exec, { nodeId: "n1", nodeName: "A", output: 1 });
    await state.clear(exec);
    expect(await state.getContext(exec)).toEqual({});
    expect(await state.getCompleted(exec)).toEqual(new Set());
  });
});
