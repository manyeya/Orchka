import { NodeType, type NodeType as NodeTypeValue } from "../core/types";

/**
 * BullMQ retry options for a single node job.
 */
export interface RetryPolicy {
  attempts: number;
  backoff?: { type: "exponential"; delay: number };
}

const IDEMPOTENT: RetryPolicy = {
  attempts: 3,
  backoff: { type: "exponential", delay: 1000 },
};

const SIDE_EFFECTING: RetryPolicy = {
  // A failed side-effecting node must NOT auto-retry: a retry re-runs the
  // executor and can post/publish twice. Exhausted attempts go to the DLQ
  // instead, where a human can deliberately re-queue.
  attempts: 1,
};

/**
 * Nodes that mutate external state (post to a social platform, send a
 * message). Retrying these risks duplicate side effects, so they never
 * auto-retry. See [[dead-letter-queue]] for how their failures are surfaced.
 */
const SIDE_EFFECTING_NODES = new Set<NodeTypeValue>([
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
]);

/**
 * HTTP methods that are safe to retry (no server-side mutation). Anything
 * else (POST/PUT/PATCH/DELETE) is treated as side-effecting.
 */
const IDEMPOTENT_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Decide the BullMQ retry policy for a node job from its type (and, for
 * HTTP_REQUEST, its configured method). Idempotent/read-only nodes retry
 * with exponential backoff; side-effecting nodes run once and fall through
 * to the dead-letter queue on failure.
 */
export function getRetryPolicy(
  type: NodeTypeValue,
  data?: Record<string, unknown>
): RetryPolicy {
  if (type === NodeType.HTTP_REQUEST) {
    const method = String(data?.method ?? "GET").toUpperCase();
    return IDEMPOTENT_HTTP_METHODS.has(method) ? IDEMPOTENT : SIDE_EFFECTING;
  }

  return SIDE_EFFECTING_NODES.has(type) ? SIDE_EFFECTING : IDEMPOTENT;
}

/**
 * Whether a node type may auto-retry at all. Used by the DLQ handler to
 * decide whether a failure is "retries exhausted" or "never retried".
 */
export function isRetryable(type: NodeTypeValue, data?: Record<string, unknown>): boolean {
  return getRetryPolicy(type, data).attempts > 1;
}
