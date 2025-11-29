import { memo } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { NodeProps } from "@xyflow/react";
import { MousePointerIcon } from "lucide-react";


export const ManualTriggerNode = memo((props: NodeProps) => {
    return (
        <BaseTriggerNode 
        {...props} 
        id={props.id} 
        icon={MousePointerIcon} 
        name="When clicking 'Execute Workflow'" 
        onSettingsClick={() => { }} 
        onDoubleClick={() => { }} 
        />
    )
})