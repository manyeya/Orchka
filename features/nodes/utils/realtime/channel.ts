import { WorkflowNodeStatus } from "@/components/workflow-node";
import { channel, topic } from "@inngest/realtime";

/**
 * Generic node status payload that works for any node type
 */
export interface NodeStatusPayload {
    nodeId: string;
    status: WorkflowNodeStatus;
    /** Optional: include the node type for filtering */
    nodeType?: string;
    /** Optional: additional metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Generic workflow node channel that handles status updates for ALL node types.
 * Instead of creating separate channels per node type, we use a single channel
 * with topics that can be filtered by nodeId on the client side.
 * 
 * Usage in executor:
 * ```typescript
 * await publish(workflowNodeChannel().status({
 *     nodeId,
 *     status: "loading",
 *     nodeType: "HTTP_REQUEST"
 * }));
 * ```
 */
export const workflowNodeChannel = channel('workflow-nodes').addTopic(
    topic('status').type<NodeStatusPayload>()
);
