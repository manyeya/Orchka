"use client"

import type { Node, NodeProps } from "@xyflow/react"
import { Send } from "lucide-react"
import { memo, useCallback } from "react"

import { NodeDetailModal, useNodeConfigActions } from "@orchka/nodes/editor"
import { BaseActionNode } from "../base-action-node"
import { XPostSettingsForm, type XPostSettings } from "./settings-form"

type XPostNodeType = Node<XPostSettings>

export const XPostNode = memo((props: NodeProps<XPostNodeType>) => {
    const nodeData = props.data as XPostSettings
    const { status, openModal, closeModal, updateNode } = useNodeConfigActions(props.id)

    const handleFormSubmit = useCallback((values: XPostSettings) => {
        updateNode({ data: values })
        closeModal()
    }, [closeModal, updateNode])

    const handleCancel = useCallback(() => {
        closeModal()
    }, [closeModal])

    const description = nodeData.text ? nodeData.text.slice(0, 80) : "Not Configured"

    return (
        <>
            <NodeDetailModal
                nodeId={props.id}
                nodeName={nodeData.name || "X Post"}
                nodeIcon={<Send className="size-5" />}
            >
                <XPostSettingsForm
                    defaultValues={nodeData}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancel}
                />
            </NodeDetailModal>
            <BaseActionNode
                {...props}
                id={props.id}
                icon={Send}
                name={nodeData.name || "X Post"}
                description={description}
                status={status}
                onSettingsClick={openModal}
                onDoubleClick={openModal}
            />
        </>
    )
})
