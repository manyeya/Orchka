"use client"

import type { Node, NodeProps } from "@xyflow/react"
import { BaseActionNode } from "../base-action-node";
import { GlobeIcon } from "lucide-react";
import { memo, useCallback } from "react";
import { SettingsPortal } from "@/features/editor/components/settings-portal";
import { HttpSettingsForm, type HttpSettingsFormValues } from "./http-settings-form";
import { useSetAtom } from "jotai";
import { updateNodeAtom, activeSettingsNodeIdAtom } from "@/features/editor/store";
import { useNodeStatus } from "@/features/nodes/utils/use-node-status";
import { getHTTPRequestToken } from "./token";
import { httpNodeChannel } from "./channel";

type HttpRequestNodeType = Node<HttpSettingsFormValues>;

export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {
    const nodeData = props.data as HttpSettingsFormValues;
    const description = nodeData.url
        ? `${nodeData.method || "GET"} ${nodeData.url}`
        : "Not Configured"
    const status = useNodeStatus({
        nodeId: props.id,
        channel: httpNodeChannel().name,
        topic: 'status',
        refreshToken: getHTTPRequestToken
    })
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
                name={nodeData.name || "HTTP Request"}
                description={description}
                status={status}
                onSettingsClick={() => { setActiveNodeId(props.id) }}
                onDoubleClick={() => { setActiveNodeId(props.id) }}
            />
        </>
    )
})
