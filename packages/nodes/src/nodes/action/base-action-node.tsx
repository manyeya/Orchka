"use client"

import { type NodeProps, Position } from "@xyflow/react"
import type { LucideIcon } from "lucide-react"
import Image from "next/image"
import { memo, type ReactNode, useCallback } from "react"

import { BaseNode, BaseNodeContent } from "@orchka/nodes/editor/react-flow/base-node"
import { BaseHandle } from "@orchka/nodes/editor/react-flow/base-handle"
import { WorkflowNode, WorkflowNodeStatus } from "@orchka/nodes/editor"
import { useNodeEditorBridge } from "@orchka/nodes/editor";

interface BaseActionNodeProps extends NodeProps {
    icon: LucideIcon | string;
    name: string;
    description?: string;
    children?: ReactNode;
    status?: WorkflowNodeStatus;
    onSettingsClick?: () => void;
    onDoubleClick?: () => void;
}

export const BaseActionNode = memo((props: BaseActionNodeProps) => {
    const { icon: Icon, name, description, children, status, onSettingsClick, onDoubleClick } = props
    const bridge = useNodeEditorBridge();
    const handleRemoveClick = useCallback(() => {
        bridge.deleteNode(props.id)
        bridge.setActiveNodeModalId(null)
    }, [bridge, props.id])
    return (
        <WorkflowNode name={name}
            description={description}
            onRemoveClick={handleRemoveClick}
            onSettingsClick={onSettingsClick}
            showToolbar={true}
            status={status}
        >
            <BaseNode onDoubleClick={onDoubleClick} className="relative group">
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
