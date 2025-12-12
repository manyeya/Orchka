"use client"

import { type NodeProps, Position } from "@xyflow/react"
import type { LucideIcon } from "lucide-react"
import Image from "next/image"
import { memo, type ReactNode, useCallback } from "react"
import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node"
import { BaseHandle } from "@/components/react-flow/base-handle"
import { WorkflowNode } from "@/components/workflow-node"
import { useDeleteNode } from "@/features/editor/hooks/use-delete-node"
import { NodeStatus, NodeStatusIndicator } from "@/components/react-flow/node-status-indicator"
import { activeSettingsNodeIdAtom } from "@/features/editor/store"
import { useSetAtom } from "jotai"

interface BaseTriggerNodeProps extends NodeProps {
    icon: LucideIcon | string;
    name: string;
    description?: string;
    children?: ReactNode;
    status?: NodeStatus;
    onSettingsClick?: () => void;
    onDoubleClick?: () => void;
}

export const BaseTriggerNode = memo((props: BaseTriggerNodeProps) => {
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
        >
            <NodeStatusIndicator variant="border" status={status} className="rounded-l-2xl">
                <BaseNode onDoubleClick={onDoubleClick} className="rounded-l-2xl relative group">
                    <BaseNodeContent>
                        {typeof Icon === "string" ? (
                            <Image src={Icon} alt={name} width={16} height={16} />
                        ) : (
                            <Icon className="size-4 text-muted-foreground group-hover:text-primary" />
                        )}
                        {children}
                        <BaseHandle id={props.id + "-source"} type="source" position={Position.Right} />
                    </BaseNodeContent>
                </BaseNode>
            </NodeStatusIndicator>
        </WorkflowNode>
    )
})
