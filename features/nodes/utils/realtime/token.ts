"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { workflowNodeChannel } from "./channel";
import { inngest } from "@/inngest/client";

/**
 * Generic token type for workflow node subscriptions (status and data)
 */
export type WorkflowNodeToken = Realtime.Token<typeof workflowNodeChannel, ['status', 'data']>;

/**
 * Get a generic subscription token for workflow node updates.
 * This single token works for subscribing to status and data updates from ANY node type.
 * 
 * Usage in React component:
 * ```typescript
 * const { data } = useInngestSubscription({
 *     refreshToken: getWorkflowNodeToken,
 * });
 * 
 * // Filter by nodeId and topic on client
 * const nodeStatus = data.filter(d => d.nodeId === myNodeId && d.topic === 'status');
 * const nodeData = data.filter(d => d.nodeId === myNodeId && d.topic === 'data');
 * ```
 */
export const getWorkflowNodeToken = async (): Promise<WorkflowNodeToken> => {
    const token = await getSubscriptionToken(inngest, {
        channel: workflowNodeChannel(),
        topics: ['status', 'data']
    });
    return token;
};
