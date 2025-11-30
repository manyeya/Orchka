'use client'

import { NodeToolbar, Position } from "@xyflow/react"
import { SettingsIcon, TrashIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "./ui/button"
import { NodeStatusIndicator } from "./react-flow/node-status-indicator"

interface WorkflowNodeProps {
    name?: string;
    description?: string;
    children: ReactNode;
    showToolbar?: boolean;
    onSettingsClick?: () => void;
    onRemoveClick?: () => void;
}

export const WorkflowNode = ({ name, description, children, showToolbar, onSettingsClick, onRemoveClick }: WorkflowNodeProps) => {
    return (
        <>
            {showToolbar && (
                <NodeToolbar>
                    <Button variant="ghost" onClick={onSettingsClick}>
                        <SettingsIcon className="size-4" />
                    </Button>
                    <Button variant="ghost" onClick={onRemoveClick}>
                        <TrashIcon className="size-4" />
                    </Button>
                </NodeToolbar>
            )}
            {children}
            {name && (
                <NodeToolbar position={Position.Bottom} isVisible className="max-w-[200px] text-center">
                    <p className="font-medium">{name}</p>
                    {description && (
                        <p className="text-sm text-muted-foreground truncate">
                            {description}
                        </p>
                    )}
                </NodeToolbar>
            )
            }

        </>
    )
}