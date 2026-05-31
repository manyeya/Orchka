import { describe, it, expect } from "vitest";
import { NodeType } from "../core/types";
import { getRetryPolicy, isRetryable } from "./retry-policy";

describe("getRetryPolicy", () => {
  const sideEffecting = [
    NodeType.X_POST,
    NodeType.LINKEDIN_POST,
    NodeType.FACEBOOK_POST,
    NodeType.INSTAGRAM_POST,
    NodeType.THREADS_POST,
    NodeType.DISCORD_MESSAGE,
    NodeType.REDDIT_POST,
    NodeType.BLUESKY_POST,
    NodeType.MASTODON_POST,
    NodeType.PINTEREST_PIN,
  ] as const;

  const idempotent = [
    NodeType.AI_GENERATE,
    NodeType.AI_EXTRACT,
    NodeType.AI_CLASSIFY,
    NodeType.AI_AGENT,
    NodeType.AI_AGENT_EXP,
    NodeType.IF_CONDITION,
    NodeType.SWITCH,
    NodeType.LOOP,
    NodeType.WAIT,
    NodeType.MERGE,
    NodeType.MANUAL_TRIGGER,
    NodeType.CRON_TRIGGER,
    NodeType.INITIAL,
  ] as const;

  it.each(sideEffecting)("treats %s as side-effecting (no retry)", (type) => {
    const policy = getRetryPolicy(type);
    expect(policy.attempts).toBe(1);
    expect(isRetryable(type)).toBe(false);
  });

  it.each(idempotent)("treats %s as idempotent (retry with backoff)", (type) => {
    const policy = getRetryPolicy(type);
    expect(policy.attempts).toBe(3);
    expect(policy.backoff).toEqual({ type: "exponential", delay: 1000 });
    expect(isRetryable(type)).toBe(true);
  });

  describe("HTTP_REQUEST depends on method", () => {
    it("retries GET (and defaults to GET when method is absent)", () => {
      expect(getRetryPolicy(NodeType.HTTP_REQUEST).attempts).toBe(3);
      expect(getRetryPolicy(NodeType.HTTP_REQUEST, { method: "GET" }).attempts).toBe(3);
      expect(getRetryPolicy(NodeType.HTTP_REQUEST, { method: "head" }).attempts).toBe(3);
    });

    it("does not retry mutating methods", () => {
      for (const method of ["POST", "PUT", "PATCH", "DELETE", "post"]) {
        expect(getRetryPolicy(NodeType.HTTP_REQUEST, { method }).attempts).toBe(1);
      }
    });
  });
});
