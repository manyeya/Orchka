"use client"

import { memo } from "react";
import { PlaceholderNode } from "@orchka/nodes/editor/react-flow/placeholder-node";
import { NodeProps } from "@xyflow/react";
import { PlusIcon } from "lucide-react";
import { WorkflowNode, useNodeSelectorComponent } from "@orchka/nodes/editor";
import { useState } from "react";

const InitialNode = memo((props: NodeProps) => {
    const NodeSelector = useNodeSelectorComponent();
    const [open, setOpen] = useState(false)
    return (
        <NodeSelector open={open} onOpenChange={setOpen}>
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
