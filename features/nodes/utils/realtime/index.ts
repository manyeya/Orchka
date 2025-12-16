/**
 * Generic Realtime Utilities for Workflow Nodes
 * 
 * This module provides a unified, scalable approach to realtime status updates
 * for all node types in the workflow editor.
 * 
 * Instead of creating separate channel/token files for each node type:
 * - ❌ features/nodes/action/https-request/channel.ts
 * - ❌ features/nodes/action/https-request/token.ts
 * - ❌ features/nodes/action/google-sheets/channel.ts
 * - ❌ features/nodes/action/google-sheets/token.ts
 * 
 * Use this unified approach:
 * - ✅ features/nodes/utils/realtime/channel.ts (single generic channel)
 * - ✅ features/nodes/utils/realtime/token.ts (single generic token)
 * 
 * @example Client-side subscription:
 * ```typescript
 * import { getWorkflowNodeToken } from "@/features/nodes/utils/realtime";
 * import { useInngestSubscription } from "@inngest/realtime/hooks";
 * 
 * const { data } = useInngestSubscription({
 *     refreshToken: getWorkflowNodeToken,
 * });
 * 
 * // Filter by your specific node
 * const myNodeUpdates = data.filter(d => d.nodeId === nodeId);
 * ```
 * 
 * @example Server-side publishing (in executor):
 * ```typescript
 * import { publishNodeStatus } from "@/features/nodes/utils/realtime";
 * 
 * await publishNodeStatus(publish, nodeId, "loading", NodeType.MY_NODE);
 * // ... do work ...
 * await publishNodeStatus(publish, nodeId, "success", NodeType.MY_NODE);
 * ```
 */

// Channel exports
export { workflowNodeChannel } from "./channel";
export type { NodeStatusPayload } from "./channel";

// Token exports
export { getWorkflowNodeToken, type WorkflowNodeToken } from "./token";

// Publishing helpers
export { publishNodeStatus, createNodeStatusPublisher } from "./publish-status";
