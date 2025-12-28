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
 * Node execution data payload for displaying input/output in the UI
 */
export interface NodeDataPayload {
    nodeId: string;
    /** Data from previous nodes (context before execution) */
    input: unknown;
    /** Result from this node's execution */
    output: unknown;
    /** Optional: include the node type for filtering */
    nodeType?: string;
    /** Optional: loop iteration info when this node is executed as part of a loop */
    iteration?: {
        index: number;
        total: number;
    };
}

/**
 * Generic workflow node channel that handles status and data updates for ALL node types.
 * Instead of creating separate channels per node type, we use a single channel
 * with topics that can be filtered by nodeId on the client side.
 * 
 * Usage in executor:
 * ```typescript
 * // Publish status
 * await publish(workflowNodeChannel().status({
 *     nodeId,
 *     status: "loading",
 *     nodeType: "HTTP_REQUEST"
 * }));
 * 
 * // Publish data
 * await publish(workflowNodeChannel().data({
 *     nodeId,
 *     input: previousContext,
 *     output: executionResult,
 *     nodeType: "HTTP_REQUEST"
 * }));
 * ```
 */
export const workflowNodeChannel = channel('workflow-nodes')
    .addTopic(topic('status').type<NodeStatusPayload>())
    .addTopic(topic('data').type<NodeDataPayload>());
