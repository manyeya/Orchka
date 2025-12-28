import { WorkflowNodeStatus } from "@/components/workflow-node";
import { workflowNodeChannel, type NodeStatusPayload, type NodeDataPayload } from "./channel";
import type { Realtime } from "@inngest/realtime";
import type { WorkflowStepTools } from "../execution/types";

/**
 * Helper function to publish node status updates.
 * Provides a clean, type-safe API for executors to publish status updates.
 * 
 * When `step` is provided, the publish call is wrapped in a step.run() with a unique
 * step ID to avoid "duplicate step ID" warnings from Inngest.
 * 
 * @example
 * ```typescript
 * // In your executor:
 * export const myNodeExecutor: NodeExecutor<MyData> = async ({
 *     nodeId,
 *     publish,
 *     step,
 *     ...
 * }) => {
 *     await publishNodeStatus(publish, nodeId, "loading", "MY_NODE_TYPE", undefined, step);
 *     
 *     try {
 *         // ... do work ...
 *         await publishNodeStatus(publish, nodeId, "success", "MY_NODE_TYPE", undefined, step);
 *     } catch (error) {
 *         await publishNodeStatus(publish, nodeId, "error", "MY_NODE_TYPE", undefined, step);
 *         throw error;
 *     }
 * };
 * ```
 */
export async function publishNodeStatus(
    publish: Realtime.PublishFn,
    nodeId: string,
    status: WorkflowNodeStatus,
    nodeType?: string,
    metadata?: Record<string, unknown>,
    step?: WorkflowStepTools
): Promise<void> {
    const payload: NodeStatusPayload = {
        nodeId,
        status,
        ...(nodeType && { nodeType }),
        ...(metadata && { metadata }),
    };

    if (step) {
        // Wrap in step.run with unique ID to avoid duplicate step ID warnings
        await step.run(`publish-status:${nodeId}:${status}`, async () => {
            await publish(workflowNodeChannel().status(payload));
        });
    } else {
        // Direct publish (may cause duplicate step ID warnings if called multiple times)
        await publish(workflowNodeChannel().status(payload));
    }
}

/**
 * Helper function to publish node execution data (input/output).
 * Used to display node input and output in the UI modal.
 * 
 * @example
 * ```typescript
 * await publishNodeData(publish, nodeId, inputContext, outputResult, "HTTP_REQUEST");
 * ```
 */
export async function publishNodeData(
    publish: Realtime.PublishFn,
    nodeId: string,
    input: unknown,
    output: unknown,
    nodeType?: string
): Promise<void> {
    const payload: NodeDataPayload = {
        nodeId,
        input,
        output,
        ...(nodeType && { nodeType }),
    };

    await publish(workflowNodeChannel().data(payload));
}

/**
 * Creates a scoped status publisher for a specific node.
 * This is useful when you need to publish multiple status updates for the same node.
 * 
 * @example
 * ```typescript
 * const statusUpdater = createNodeStatusPublisher(publish, nodeId, "MY_NODE_TYPE");
 * 
 * await statusUpdater("loading");
 * // ... do work ...
 * await statusUpdater("success");
 * ```
 */
export function createNodeStatusPublisher(
    publish: Realtime.PublishFn,
    nodeId: string,
    nodeType?: string
) {
    return async (
        status: WorkflowNodeStatus,
        metadata?: Record<string, unknown>
    ) => {
        await publishNodeStatus(publish, nodeId, status, nodeType, metadata);
    };
}
