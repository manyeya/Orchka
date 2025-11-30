import type { Node, NodeProps } from "@xyflow/react"
import { BaseActionNode } from "../base-action-node";
import { GlobeIcon } from "lucide-react";
import { memo, useCallback } from "react";
import { SettingsPortal } from "@/features/editor/components/settings-portal";
import { useState } from "react";
import { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { HttpSettingsForm, type HttpSettingsFormValues } from "./http-settings-form";
import { useSetAtom } from "jotai";
import { updateNodeAtom, activeSettingsNodeIdAtom } from "@/features/editor/store";


type HttpRequestNodeData = {
    endpoint?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
    body?: string;
    settings?: HttpSettingsFormValues;
    [key: string]: unknown;
}

type HttpRequestNodeType = Node<HttpRequestNodeData>;

export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {
    const nodeData = props.data as HttpRequestNodeData;
    const description = nodeData.settings?.url
        ? `${nodeData.settings.method || "GET"} ${nodeData.settings.url}`
        : "Not Configured"
    const [status, setStatus] = useState<NodeStatus>("initial")
    const setActiveNodeId = useSetAtom(activeSettingsNodeIdAtom);
    const updateNode = useSetAtom(updateNodeAtom);

    const handleFormSubmit = useCallback((values: HttpSettingsFormValues) => {
        // Update node data with form values using Jotai store
        updateNode({
            id: props.id,
            updates: {
                data: {
                    ...props.data,
                    settings: values,
                    endpoint: values.url,
                    method: values.method,
                    body: values.body,
                }
            }
        });
        setActiveNodeId(null);
    }, [props.id, props.data, updateNode, setActiveNodeId])

    const handleCancel = useCallback(() => {
        setActiveNodeId(null);
    }, [setActiveNodeId])

    return (
        <>
            <SettingsPortal nodeId={props.id}>
                <div className="p-6">
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold">HTTP Request Settings</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Configure your HTTP request with headers, authentication, and more
                        </p>
                    </div>
                    <HttpSettingsForm
                        defaultValues={nodeData.settings}
                        onSubmit={handleFormSubmit}
                        onCancel={handleCancel}
                    />
                </div>
            </SettingsPortal>
            <BaseActionNode
                {...props}
                id={props.id}
                icon={GlobeIcon}
                name="HTTP Request"
                description={description}
                status={status}
                onSettingsClick={() => { setActiveNodeId(props.id) }}
                onDoubleClick={() => { setActiveNodeId(props.id) }}
            />
        </>
    )
})
