import { WorkflowNodeStatus } from "@/components/workflow-node";
import { channel, topic } from "@inngest/realtime";

export const httpNodeChannel = channel('http-node').addTopic(topic('status').type<{
    nodeId: string;
    status: WorkflowNodeStatus
}>());