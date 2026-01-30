'use client'

import { NodeToolbar, Position } from "@xyflow/react"
import { CheckIcon, SettingsIcon, TrashIcon, XIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "./ui/button"
import { Spinner } from "./ui/spinner"

export type WorkflowNodeStatus = "loading" | "success" | "error" | "initial";

interface WorkflowNodeProps {
    name?: string;
    description?: string;
    children: ReactNode;
    showToolbar?: boolean;
    onSettingsClick?: () => void;
    onRemoveClick?: () => void;
    status?: WorkflowNodeStatus;

}

const StatusIcon = ({ status }: { status: WorkflowNodeStatus }) => {
    switch (status) {
        case "loading":
            return <Spinner className="text-primary"/>
        case "success":
            return <CheckIcon className="size-4 text-green-500" />
        case "error":
            return <XIcon className="size-4 text-red-500" />
        case "initial":
            return null
        default:
            return null
    }
}

export const WorkflowNode = ({ name, description, children, showToolbar, onSettingsClick, onRemoveClick, status }: WorkflowNodeProps) => {
    return (
        <div className="cursor-pointer active:cursor-grabbing ">
            {showToolbar && (
                <NodeToolbar>
                    <Button className="cursor-pointer" variant="ghost" onClick={onSettingsClick}>
                        <SettingsIcon className="size-4" />
                    </Button>
                    <Button className="cursor-pointer" variant="ghost" onClick={onRemoveClick}>
                        <TrashIcon className="size-4" />
                    </Button>
                </NodeToolbar>
            )}
            {children}
            <NodeToolbar position={Position.Bottom} isVisible className="max-w-[200px] text-center">
                {name && (<>
                    <p className="font-medium text-sm">{name}</p>
                    {description && (
                        <p className="text-xs text-muted-foreground truncate">
                            {description}
                        </p>
                    )}
                </>
                )}
                {status && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <StatusIcon status={status} />
                    </div>
                )}
            </NodeToolbar>
        </div>
    )
}