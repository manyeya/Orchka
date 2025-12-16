import { WorkflowNodeStatus } from "@/components/workflow-node";
import { workflowNodeChannel, type NodeStatusPayload } from "./channel";
import type { Realtime } from "@inngest/realtime";

/**
 * Helper function to publish node status updates.
 * Provides a clean, type-safe API for executors to publish status updates.
 * 
 * @example
 * ```typescript
 * // In your executor:
 * export const myNodeExecutor: NodeExecutor<MyData> = async ({
 *     nodeId,
 *     publish,
 *     ...
 * }) => {
 *     await publishNodeStatus(publish, nodeId, "loading", "MY_NODE_TYPE");
 *     
 *     try {
 *         // ... do work ...
 *         await publishNodeStatus(publish, nodeId, "success", "MY_NODE_TYPE");
 *     } catch (error) {
 *         await publishNodeStatus(publish, nodeId, "error", "MY_NODE_TYPE");
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
    metadata?: Record<string, unknown>
): Promise<void> {
    const payload: NodeStatusPayload = {
        nodeId,
        status,
        ...(nodeType && { nodeType }),
        ...(metadata && { metadata }),
    };

    await publish(workflowNodeChannel().status(payload));
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
