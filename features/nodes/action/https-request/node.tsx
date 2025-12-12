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


type HttpRequestNodeType = Node<HttpSettingsFormValues>;

export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {
    const nodeData = props.data as HttpSettingsFormValues;
    const description = nodeData.url
        ? `${nodeData.method || "GET"} ${nodeData.url}`
        : "Not Configured"
    const [status, setStatus] = useState<NodeStatus>("initial")
    const setActiveNodeId = useSetAtom(activeSettingsNodeIdAtom);
    const updateNode = useSetAtom(updateNodeAtom);

    const handleFormSubmit = useCallback((values: HttpSettingsFormValues) => {
        // Update node data with form values using Jotai store
        updateNode({
            id: props.id,
            updates: {
                data: values
            }
        });
        setActiveNodeId(null);
    }, [props.id, updateNode, setActiveNodeId])

    const handleCancel = useCallback(() => {
        setActiveNodeId(null);
    }, [setActiveNodeId])

    return (
        <>
            <SettingsPortal nodeId={props.id}>
                <HttpSettingsForm
                    defaultValues={nodeData}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancel}
                />
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
