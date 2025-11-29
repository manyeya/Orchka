import { memo } from "react";
import { PlaceholderNode } from "@/components/react-flow/placeholder-node";
import { NodeProps } from "@xyflow/react";
import { PlusIcon } from "lucide-react";
import { WorkflowNode } from "../workflow-node";

const InitialNode = memo((props: NodeProps) => {
    return (
        <WorkflowNode showToolbar={false}>
            <PlaceholderNode
                onClick={() => {
                    console.log("click")
                }}
                {...props}
            >
                <div className="cursor-pointer flex items-center justify-center">
                    <PlusIcon className="size-4" />
                </div>
            </PlaceholderNode>
        </WorkflowNode>
    );
});

export default InitialNode

InitialNode.displayName = "InitialNode";