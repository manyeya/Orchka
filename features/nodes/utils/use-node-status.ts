import { WorkflowNodeStatus } from "@/components/workflow-node";
import type { Realtime } from "@inngest/realtime";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useEffect, useState } from "react";

interface UseNodeStatusOptions {
    nodeId: string;
    channel: string;
    topic: string;
    refreshToken: () => Promise<Realtime.Subscribe.Token>;
}

export const useNodeStatus = ({
    nodeId,
    channel,
    topic,
    refreshToken
}: UseNodeStatusOptions) => {
    const [status, setStatus] = useState<WorkflowNodeStatus>('initial');
    const { data } = useInngestSubscription({
        refreshToken,
        enabled: true,
    })

    useEffect(() => {
        if (!data.length) {
            return;
        }

        const latestMessage = data
            .filter((message) => message.kind === "data" 
            && message.data.nodeId === nodeId 
            && message.channel === channel 
            && message.topic === topic)
            .sort((a,b)=>{
                if(a.kind === "data" && b.kind === "data") {
                    return b.createdAt.getTime() - a.createdAt.getTime();
                }
                return 0;
            })[0];

            if(latestMessage && latestMessage.kind === "data") {
                setStatus(latestMessage.data.status as WorkflowNodeStatus);
            }
    
    }, [data, nodeId, channel, topic]);

    return status;
};