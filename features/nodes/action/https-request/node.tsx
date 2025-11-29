import type { Node, NodeProps } from "@xyflow/react"
import { BaseActionNode } from "../base-action-node";
import { GlobeIcon } from "lucide-react";
import { memo } from "react";


type HttpRequestNodeData = {
    endpoint?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
    body?: string;
    [key: string]: unknown;
}

type HttpRequestNodeType = Node<HttpRequestNodeData>;

export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {
    const nodeData = props.data as HttpRequestNodeData;
    const description = nodeData.endpoint ? `${nodeData.method || "GET"} ${nodeData.endpoint}` : "Not Configured"
    return (
        <BaseActionNode 
        {...props} 
        id={props.id} 
        icon={GlobeIcon} 
        name="HTTP Request" 
        description={description} 
        onSettingsClick={() => { }} 
        onDoubleClick={() => { }} 
        />
    )
})
