"use client"

import type { Node, NodeProps } from "@xyflow/react"
import type { LucideIcon } from "lucide-react"
import { memo, useCallback } from "react"
import type { ZodTypeAny } from "zod"

import { NodeDetailModal, useNodeConfigActions } from "@orchka/nodes/editor"
import { BaseActionNode } from "../base-action-node"
import { FieldConfig, SocialSettingsForm } from "./settings-form"

interface SocialNodeProps {
    props: NodeProps<Node<Record<string, unknown>>>
    schema: ZodTypeAny
    fields: FieldConfig[]
    icon: LucideIcon
    title: string
    description: string
    defaultData: Record<string, unknown>
    credentialType?: any
    summaryField: string
}

function SocialNodeInner({
    props,
    schema,
    fields,
    icon: Icon,
    title,
    description,
    defaultData,
    credentialType,
    summaryField,
}: SocialNodeProps) {
    const nodeData = { ...defaultData, ...(props.data || {}) }
    const { status, openModal, closeModal, updateNode } = useNodeConfigActions(props.id)

    const handleFormSubmit = useCallback((values: Record<string, unknown>) => {
        updateNode({ data: values })
        closeModal()
    }, [closeModal, updateNode])

    const handleCancel = useCallback(() => {
        closeModal()
    }, [closeModal])

    const summary = String((nodeData as Record<string, unknown>)[summaryField] || "Not Configured").slice(0, 80)

    return (
        <>
            <NodeDetailModal
                nodeId={props.id}
                nodeName={String((nodeData as Record<string, unknown>).name || title)}
                nodeIcon={<Icon className="size-5" />}
            >
                <SocialSettingsForm
                    schema={schema}
                    credentialType={credentialType}
                    defaultValues={nodeData}
                    fields={fields}
                    title={title}
                    description={description}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancel}
                />
            </NodeDetailModal>
            <BaseActionNode
                {...props}
                id={props.id}
                icon={Icon}
                name={String((nodeData as Record<string, unknown>).name || title)}
                description={summary}
                status={status}
                onSettingsClick={openModal}
                onDoubleClick={openModal}
            />
        </>
    )
}

export const createSocialNode = (config: Omit<SocialNodeProps, "props">) => {
    return memo((props: NodeProps<Node<Record<string, unknown>>>) => (
        <SocialNodeInner {...config} props={props} />
    ))
}
