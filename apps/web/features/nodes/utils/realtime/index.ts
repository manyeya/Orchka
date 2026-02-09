/**
 * Realtime Utilities
 * 
 * Simplified for BullMQ/SSE implementation.
 */

export type { NodeStatusPayload, NodeDataPayload, PublishFn } from "@orchka/workflow-engine/types";

// Dummy exports for backward compatibility during migration
// These should be removed from components eventually
export const getWorkflowNodeToken = async () => ({ token: 'deprecated' } as any);
export const workflowNodeChannel = () => ({ name: 'deprecated' } as any);

export { publishNodeStatus, publishNodeData, createNodeStatusPublisher } from "./publish-status";
