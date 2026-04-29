"use client"

import type { Node, NodeProps } from "@xyflow/react"
import { Linkedin } from "lucide-react"
import { memo, useCallback } from "react"

import { NodeDetailModal, useNodeConfigActions } from "@orchka/nodes/editor"
import { BaseActionNode } from "../base-action-node"
import { LinkedInPostSettingsForm, type LinkedInPostSettings } from "./settings-form"

type LinkedInPostNodeType = Node<LinkedInPostSettings>

export const LinkedInPostNode = memo((props: NodeProps<LinkedInPostNodeType>) => {
    const nodeData = props.data as LinkedInPostSettings
    const { status, openModal, closeModal, updateNode } = useNodeConfigActions(props.id)

    const handleFormSubmit = useCallback((values: LinkedInPostSettings) => {
        updateNode({ data: values })
        closeModal()
    }, [closeModal, updateNode])

    const handleCancel = useCallback(() => {
        closeModal()
    }, [closeModal])

    const description = nodeData.commentary ? nodeData.commentary.slice(0, 80) : "Not Configured"

    return (
        <>
            <NodeDetailModal
                nodeId={props.id}
                nodeName={nodeData.name || "LinkedIn Post"}
                nodeIcon={<Linkedin className="size-5" />}
            >
                <LinkedInPostSettingsForm
                    defaultValues={nodeData}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancel}
                />
            </NodeDetailModal>
            <BaseActionNode
                {...props}
                id={props.id}
                icon={Linkedin}
                name={nodeData.name || "LinkedIn Post"}
                description={description}
                status={status}
                onSettingsClick={openModal}
                onDoubleClick={openModal}
            />
        </>
    )
})
