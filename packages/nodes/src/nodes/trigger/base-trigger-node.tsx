"use client"

import { type NodeProps, Position } from "@xyflow/react"
import type { LucideIcon } from "lucide-react"
import Image from "next/image"
import { memo, type ReactNode, useCallback } from "react"
import { BaseNode, BaseNodeContent } from "@orchka/nodes/editor/react-flow/base-node"
import { BaseHandle } from "@orchka/nodes/editor/react-flow/base-handle"
import { WorkflowNode, WorkflowNodeStatus } from "@orchka/nodes/editor"
import { useNodeEditorBridge } from "@orchka/nodes/editor"

interface BaseTriggerNodeProps extends NodeProps {
    icon: LucideIcon | string;
    name: string;
    description?: string;
    children?: ReactNode;
    status?: WorkflowNodeStatus;
    onSettingsClick?: () => void;
    onDoubleClick?: () => void;
}

export const BaseTriggerNode = memo((props: BaseTriggerNodeProps) => {
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
            <BaseNode onDoubleClick={onDoubleClick} className="rounded-l-2xl relative group ">
                <BaseNodeContent>
                    {typeof Icon === "string" ? (
                        <Image src={Icon} alt={name} width={16} height={16} />
                    ) : (
                        <Icon className="size-4 text-muted-foreground group-hover:text-primary size-6" />
                    )}
                    {children}
                    <BaseHandle id={props.id + "-source"} type="source" position={props.sourcePosition || Position.Right} />
                </BaseNodeContent>
            </BaseNode>
        </WorkflowNode>
    )
})
