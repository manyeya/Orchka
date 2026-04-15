"use client"

import type { Node, NodeProps } from "@xyflow/react"
import { BaseActionNode } from "../base-action-node";
import { GlobeIcon } from "lucide-react";
import { memo, useCallback } from "react";
import { NodeDetailModal, useNodeConfigActions } from "@orchka/nodes/editor";
import { HttpSettingsForm, type HttpSettingsFormValues } from "./http-settings-form";

type HttpRequestNodeType = Node<HttpSettingsFormValues>;

export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {
    const nodeData = props.data as HttpSettingsFormValues;
    const description = nodeData.url
        ? `${nodeData.method || "GET"} ${nodeData.url}`
        : "Not Configured"
    const { status, openModal, closeModal, updateNode } = useNodeConfigActions(props.id);

    const handleFormSubmit = useCallback((values: HttpSettingsFormValues) => {
        updateNode({ data: values });
        closeModal();
    }, [closeModal, updateNode])

    const handleCancel = useCallback(() => {
        closeModal();
    }, [closeModal])

    return (
        <>
            <NodeDetailModal
                nodeId={props.id}
                nodeName={nodeData.name || "HTTP Request"}
                nodeIcon={<GlobeIcon className="size-5" />}
            >
                <HttpSettingsForm
                    defaultValues={nodeData}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancel}
                />
            </NodeDetailModal>
            <BaseActionNode
                {...props}
                id={props.id}
                icon={GlobeIcon}
                name={nodeData.name || "HTTP Request"}
                description={description}
                status={status}
                onSettingsClick={openModal}
                onDoubleClick={openModal}
            />
        </>
    )
})
