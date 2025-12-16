"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { workflowNodeChannel } from "./channel";
import { inngest } from "@/inngest/client";

/**
 * Generic token type for workflow node status subscriptions
 */
export type WorkflowNodeToken = Realtime.Token<typeof workflowNodeChannel, ['status']>;

/**
 * Get a generic subscription token for workflow node status updates.
 * This single token works for subscribing to status updates from ANY node type.
 * 
 * Usage in React component:
 * ```typescript
 * const { data } = useInngestSubscription({
 *     refreshToken: getWorkflowNodeToken,
 * });
 * 
 * // Filter by nodeId on client
 * const nodeStatus = data.filter(d => d.nodeId === myNodeId);
 * ```
 */
export const getWorkflowNodeToken = async (): Promise<WorkflowNodeToken> => {
    const token = await getSubscriptionToken(inngest, {
        channel: workflowNodeChannel(),
        topics: ['status']
    });
    return token;
};
