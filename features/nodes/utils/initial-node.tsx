"use client"

import { memo } from "react";
import { PlaceholderNode } from "@/components/react-flow/placeholder-node";
import { NodeProps } from "@xyflow/react";
import { PlusIcon } from "lucide-react";
import { WorkflowNode } from "../../../components/workflow-node";
import { NodeSelector } from "@/features/editor/components/node-selector";
import { useState } from "react";

const InitialNode = memo((props: NodeProps) => {
    const [open, setOpen] = useState(false)
    return (
        <NodeSelector open={open} onOpenChange={() => { setOpen(!open) }}>
            <WorkflowNode showToolbar={false}>
                <PlaceholderNode
                    onClick={() => {
                        setOpen(true)
                    }}
                    {...props}
                >
                    <div className="cursor-pointer flex items-center justify-center">
                        <PlusIcon className="size-4" />
                    </div>
                </PlaceholderNode>
            </WorkflowNode>
        </NodeSelector>
    );
});

export default InitialNode

InitialNode.displayName = "InitialNode";