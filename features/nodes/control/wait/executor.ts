import { NodeType } from "@/features/nodes/types";
import type { NodeExecutor, WorkflowContext, BranchDecision } from "../../utils/execution/types";
import { publishNodeStatus } from "../../utils/realtime";
import { evaluate, type ExpressionContext } from "@/features/editor/utils/expression-engine";
import type { WaitNodeData } from "../types";

/**
 * Result from Wait Node execution including branch decision
 */
export interface WaitNodeResult {
  context: WorkflowContext;
  branchDecision: BranchDecision;
}

/**
 * Unit multipliers for converting duration to milliseconds
 */
const UNIT_MULTIPLIERS: Record<string, number> = {
  seconds: 1000,
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
};

/**
 * Calculates the duration in milliseconds from a value and unit.
 * 
 * @param value - The numeric duration value
 * @param unit - The time unit (seconds, minutes, hours, days)
 * @returns Duration in milliseconds
 * 
 * Requirements:
 * - 4.5: Use Inngest's step.sleep for durable waiting
 */
export function calculateDurationMs(
  value: number,
  unit: "seconds" | "minutes" | "hours" | "days"
): number {
  const multiplier = UNIT_MULTIPLIERS[unit];
  if (!multiplier) {
    console.warn(`Wait Node: Unknown unit "${unit}", defaulting to seconds`);
    return value * 1000;
  }
  return value * multiplier;
}

/**
 * Resolves the "until" timestamp from an expression or ISO string.
 * 
 * @param until - The timestamp expression or ISO string
 * @param expressionContext - The expression context for evaluation
 * @returns Promise resolving to Date object
 * 
 * Requirements:
 * - 4.5: Use Inngest's step.sleepUntil for durable waiting
 */
export async function resolveUntilTimestamp(
  until: string,
  expressionContext?: ExpressionContext
): Promise<Date> {
  // Empty until expression
  if (!until || until.trim() === "") {
    throw new Error("Wait Node: Empty 'until' expression");
  }

  let resolved: unknown;

  // Check if it's an expression (contains {{ }})
  if (until.includes("{{") && until.includes("}}")) {
    if (!expressionContext) {
      throw new Error("Wait Node: No expression context provided for 'until' expression");
    }
    try {
      resolved = await evaluate(until, expressionContext);
    } catch (error) {
      throw new Error(`Wait Node: Error evaluating 'until' expression: ${error}`);
    }
  } else {
    // Treat as a literal timestamp
    resolved = until;
  }

  // Convert to Date
  if (resolved instanceof Date) {
    return resolved;
  }

  if (typeof resolved === "string") {
    const date = new Date(resolved);
    if (isNaN(date.getTime())) {
      throw new Error(`Wait Node: Invalid timestamp "${resolved}"`);
    }
    return date;
  }

  if (typeof resolved === "number") {
    // Assume it's a Unix timestamp in milliseconds
    return new Date(resolved);
  }

  throw new Error(`Wait Node: Cannot convert "${typeof resolved}" to timestamp`);
}

/**
 * Wait Node Executor
 * 
 * Pauses workflow execution for a specified duration or until a specific timestamp.
 * Uses Inngest's step.sleep or step.sleepUntil for durable waiting.
 * 
 * Requirements:
 * - 4.5: Use Inngest's step.sleep for duration mode, step.sleepUntil for until mode
 * - 4.6: Continue execution to connected downstream nodes after wait completes
 * - 4.7: Publish status updates via realtime channel
 */
export const waitNodeExecutor: NodeExecutor<WaitNodeData> = async ({
  data,
  nodeId,
  context,
  step,
  expressionContext,
  publish,
}): Promise<WorkflowContext> => {
  // Publish loading status
  await publishNodeStatus(publish, nodeId, "loading", NodeType.WAIT);

  const nodeName = data.name || "Wait";
  const stepName = `${nodeName} (${nodeId})`;

  try {
    let waitInfo: { mode: string; duration?: number; until?: string };

    if (data.mode === "duration") {
      // Duration mode: use step.sleep
      if (!data.duration) {
        throw new Error("Wait Node: Duration configuration is required for duration mode");
      }

      const durationMs = calculateDurationMs(data.duration.value, data.duration.unit);

      // Inngest step.sleep expects a duration string like "5m" or milliseconds
      // Convert to a human-readable format for the step name
      const durationStr = `${data.duration.value}${data.duration.unit.charAt(0)}`;

      await step.sleep(`${stepName} - sleep ${durationStr}`, durationMs);

      waitInfo = {
        mode: "duration",
        duration: durationMs,
      };
    } else {
      // Until mode: use step.sleepUntil
      const untilDate = await resolveUntilTimestamp(data.until || "", expressionContext);

      await step.sleepUntil(`${stepName} - sleep until`, untilDate);

      waitInfo = {
        mode: "until",
        until: untilDate.toISOString(),
      };
    }

    // Build the branch decision
    const branchDecision: BranchDecision = {
      branch: "main",
      data: waitInfo,
    };

    // Publish success status
    await publishNodeStatus(publish, nodeId, "success", NodeType.WAIT);

    // Return the context following the standard structure: { [nodeName]: { completed, mode, duration?, until? } }
    // IMPORTANT: Spread context FIRST, then set __branchDecision to ensure it's not overwritten
    return {
      ...context,
      [`${nodeName}`]: {
        completed: true,
        mode: waitInfo.mode,
        ...(waitInfo.duration && { duration: waitInfo.duration }),
        ...(waitInfo.until && { until: waitInfo.until }),
      },
      __branchDecision: branchDecision,
    };
  } catch (error) {
    // Publish error status
    await publishNodeStatus(publish, nodeId, "error", NodeType.WAIT);
    throw error;
  }
};
