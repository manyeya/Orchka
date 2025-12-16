"use client"

import type { Node, NodeProps } from "@xyflow/react"
import { BaseActionNode } from "../base-action-node";
import { GlobeIcon } from "lucide-react";
import { memo, useCallback } from "react";
import { NodeDetailModal } from "@/features/editor/components/node-detail-modal";
import { HttpSettingsForm, type HttpSettingsFormValues } from "./http-settings-form";
import { useSetAtom } from "jotai";
import { updateNodeAtom, activeNodeModalIdAtom } from "@/features/editor/store";
import { useNodeStatus } from "@/features/nodes/utils/use-node-status";
import { getWorkflowNodeToken, workflowNodeChannel } from "@/features/nodes/utils/realtime";

type HttpRequestNodeType = Node<HttpSettingsFormValues>;

export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {
    const nodeData = props.data as HttpSettingsFormValues;
    const description = nodeData.url
        ? `${nodeData.method || "GET"} ${nodeData.url}`
        : "Not Configured"
    const status = useNodeStatus({
        nodeId: props.id,
        channel: workflowNodeChannel().name,
        topic: 'status',
        refreshToken: getWorkflowNodeToken
    })
    const setActiveNodeId = useSetAtom(activeNodeModalIdAtom);
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

    const openModal = useCallback(() => {
        setActiveNodeId(props.id);
    }, [props.id, setActiveNodeId]);

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
