import Redis from "ioredis";
import type { BranchDecision } from "./types";

/**
 * Authoritative, shared execution state in Redis for the parallel execution
 * path (`ORCHKA_PARALLEL_BRANCHES`). When independent branches run as
 * concurrent BullMQ jobs, threading context/completed/branch state through each
 * job payload no longer works: two concurrent jobs carry divergent copies and
 * lose each other's updates at a fan-in (MERGE) node. Instead, every job reads
 * and writes this single per-execution state.
 *
 * Correctness without Lua: Redis executes each command atomically and serially.
 * `commitNode` writes a node's output to the context hash BEFORE adding the
 * node to the `completed` set, so any job that observes a node as completed is
 * guaranteed to also observe its context. The last job to finish always sees
 * every completion (it read after everyone else's SADD), so fan-in joins and
 * completion detection never miss a node. Double-enqueue is prevented by
 * `claimNode` (SADD returns the number of newly-added members → exactly one
 * caller wins).
 *
 * See [[plan-next-nodes]] for the pure readiness/completion logic that consumes
 * these sets.
 */

const STATE_TTL_SECONDS = 60 * 60 * 24; // 24h safety net against leaked keys

export interface RedisLike {
  hset(key: string, field: string, value: string): Promise<unknown>;
  hgetall(key: string): Promise<Record<string, string>>;
  sadd(key: string, member: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  set(key: string, value: string, mode: "NX"): Promise<unknown>;
  expire(key: string, seconds: number): Promise<unknown>;
  del(...keys: string[]): Promise<unknown>;
}

const defaultRedis: RedisLike = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
) as unknown as RedisLike;

function keys(executionId: string) {
  const base = `exec:${executionId}`;
  return {
    context: `${base}:context`,
    completed: `${base}:completed`,
    skipped: `${base}:skipped`,
    branch: `${base}:branch`,
    enqueued: `${base}:enqueued`,
    finalized: `${base}:finalized`,
  };
}

export class ExecutionState {
  constructor(private redis: RedisLike = defaultRedis) {}

  /** Seed the context hash with any initial trigger data. */
  async init(executionId: string, initialContext: Record<string, unknown> = {}): Promise<void> {
    const k = keys(executionId);
    for (const [name, value] of Object.entries(initialContext)) {
      await this.redis.hset(k.context, name, JSON.stringify(value));
    }
    await this.touch(executionId);
  }

  /**
   * Atomically record a node's completion: write its output to the context
   * hash and (optionally) its branch decision / skipped successors, THEN add it
   * to the completed set. The completed-set write is intentionally last.
   */
  async commitNode(
    executionId: string,
    args: {
      nodeId: string;
      nodeName: string;
      output: unknown;
      branchDecision?: BranchDecision;
      skippedNodeIds?: string[];
    }
  ): Promise<void> {
    const k = keys(executionId);
    await this.redis.hset(k.context, args.nodeName, JSON.stringify(args.output ?? null));
    if (args.branchDecision) {
      await this.redis.hset(k.branch, args.nodeId, JSON.stringify(args.branchDecision));
    }
    for (const skippedId of args.skippedNodeIds ?? []) {
      await this.redis.sadd(k.skipped, skippedId);
    }
    // MUST be last: visibility of `completed` implies visibility of the above.
    await this.redis.sadd(k.completed, args.nodeId);
    await this.touch(executionId);
  }

  /** Mark nodes skipped without completing them (non-taken branches). */
  async markSkipped(executionId: string, nodeIds: string[]): Promise<void> {
    if (nodeIds.length === 0) return;
    const k = keys(executionId);
    for (const id of nodeIds) await this.redis.sadd(k.skipped, id);
  }

  /**
   * Try to claim a node for enqueue. Returns true for exactly one caller even
   * if several parents finish concurrently — the double-enqueue guard.
   */
  async claimNode(executionId: string, nodeId: string): Promise<boolean> {
    const added = await this.redis.sadd(keys(executionId).enqueued, nodeId);
    return added === 1;
  }

  /** Reconstruct the flat context bag (keyed by node name). */
  async getContext(executionId: string): Promise<Record<string, unknown>> {
    const raw = await this.redis.hgetall(keys(executionId).context);
    const out: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(raw || {})) {
      try {
        out[name] = JSON.parse(value);
      } catch {
        out[name] = value;
      }
    }
    return out;
  }

  async getCompleted(executionId: string): Promise<Set<string>> {
    return new Set(await this.redis.smembers(keys(executionId).completed));
  }

  async getSkipped(executionId: string): Promise<Set<string>> {
    return new Set(await this.redis.smembers(keys(executionId).skipped));
  }

  async getBranchDecisions(executionId: string): Promise<Record<string, BranchDecision>> {
    const raw = await this.redis.hgetall(keys(executionId).branch);
    const out: Record<string, BranchDecision> = {};
    for (const [nodeId, value] of Object.entries(raw || {})) {
      try {
        out[nodeId] = JSON.parse(value) as BranchDecision;
      } catch {
        /* skip malformed */
      }
    }
    return out;
  }

  /**
   * Claim the right to finalize the execution. SET NX returns truthy for the
   * first caller only, so exactly one branch marks the workflow done.
   */
  async tryFinalize(executionId: string): Promise<boolean> {
    const res = await this.redis.set(keys(executionId).finalized, "1", "NX");
    return res === "OK" || res === true;
  }

  /** Delete all state for an execution (called after finalize). */
  async clear(executionId: string): Promise<void> {
    const k = keys(executionId);
    await this.redis.del(k.context, k.completed, k.skipped, k.branch, k.enqueued, k.finalized);
  }

  private async touch(executionId: string): Promise<void> {
    const k = keys(executionId);
    await Promise.all(
      Object.values(k).map((key) => this.redis.expire(key, STATE_TTL_SECONDS))
    );
  }
}

/** Shared instance backed by the default Redis connection. */
export const executionState = new ExecutionState();

/** Whether the parallel branch execution path is enabled. Default: off. */
export function isParallelExecutionEnabled(): boolean {
  const v = process.env.ORCHKA_PARALLEL_BRANCHES;
  return v === "1" || v === "true";
}
