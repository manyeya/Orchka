import type {
  PublishFn,
  NodeStatusPayload,
  NodeDataPayload,
} from "../execution/types";

/**
 * Helper function to publish node status updates.
 * Used by executors to update node status in real-time.
 */
export async function publishNodeStatus(
    publish: PublishFn,
    nodeId: string,
    status: NodeStatusPayload['status'],
    nodeType?: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    const payload: NodeStatusPayload = {
        nodeId,
        status,
        ...(nodeType && { nodeType }),
        ...(metadata && { metadata }),
    };

    await publish(payload);
}

/**
 * Helper function to publish node execution data (input/output).
 * Used to display node input and output in the UI modal.
 */
export async function publishNodeData(
    publish: PublishFn,
    nodeId: string,
    input: Record<string, unknown>,
    output: Record<string, unknown>,
    nodeType: string
): Promise<void> {
    const payload: NodeDataPayload = {
        nodeId,
        input,
        output,
        nodeType,
    };

    await publish(payload);
}

/**
 * Creates a scoped status publisher for a specific node.
 */
export function createNodeStatusPublisher(
    publish: PublishFn,
    nodeId: string,
    nodeType?: string
) {
    return async (
        status: NodeStatusPayload['status'],
        metadata?: Record<string, unknown>
    ) => {
        await publishNodeStatus(publish, nodeId, status, nodeType, metadata);
    };
}
