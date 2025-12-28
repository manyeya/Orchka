"use client"

import { type NodeProps, Position } from "@xyflow/react"
import type { LucideIcon } from "lucide-react"
import Image from "next/image"
import { memo, type ReactNode, useCallback } from "react"

import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node"
import { BaseHandle } from "@/components/react-flow/base-handle"
import { WorkflowNode, WorkflowNodeStatus } from "@/components/workflow-node"
import { useDeleteNode } from "@/features/editor/hooks/use-delete-node"
import { activeSettingsNodeIdAtom } from "@/features/editor/store"
import { useSetAtom } from "jotai";

interface BaseAiNodeProps extends NodeProps {
    icon: LucideIcon | string;
    name: string;
    description?: string;
    children?: ReactNode;
    status?: WorkflowNodeStatus;
    onSettingsClick?: () => void;
    onDoubleClick?: () => void;
}

export const BaseAiNodeComponent = memo((props: BaseAiNodeProps) => {
    const { icon: Icon, name, description, children, status, onSettingsClick, onDoubleClick } = props
    const deleteNode = useDeleteNode()
    const setActiveNodeId = useSetAtom(activeSettingsNodeIdAtom);
    const handleRemoveClick = useCallback(() => {
        deleteNode(props.id)
        setActiveNodeId(null)
    }, [props.id, deleteNode, setActiveNodeId])
    return (
        <WorkflowNode name={name}
            description={description}
            onRemoveClick={handleRemoveClick}
            onSettingsClick={onSettingsClick}
            showToolbar={true}
            status={status}
        >
            <BaseNode onDoubleClick={onDoubleClick} className="relative group min-w-28">
                <BaseNodeContent>
                    {typeof Icon === "string" ? (
                        <Image src={Icon} alt={name} width={16} height={16} />
                    ) : (
                        <Icon className="size-4 text-muted-foreground group-hover:text-primary size-6" />
                    )}
                    {children}
                    <BaseHandle id={props.id + "-target"} type="target" position={props.targetPosition || Position.Left} />
                    <BaseHandle id={props.id + "-source"} type="source" position={props.sourcePosition || Position.Right} />
                </BaseNodeContent>
            </BaseNode>
        </WorkflowNode>
    )
})