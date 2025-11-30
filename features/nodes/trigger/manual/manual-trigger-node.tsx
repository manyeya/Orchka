import { memo, useState } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { NodeProps } from "@xyflow/react";
import { MousePointerIcon } from "lucide-react";
import { SettingsPortal } from "@/features/editor/components/settings-portal";
import { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { useSetAtom } from "jotai";
import { activeSettingsNodeIdAtom } from "@/features/editor/store";



export const ManualTriggerNode = memo((props: NodeProps) => {
    const setActiveNodeId = useSetAtom(activeSettingsNodeIdAtom);
    const [status, setStatus] = useState<NodeStatus>("initial")
    return (
        <>
            <SettingsPortal nodeId={props.id}>
                <div className="p-4">
                    <p className="text-muted-foreground">Manually Trigger the Workflow</p>
                </div>
            </SettingsPortal>
            <BaseTriggerNode
                {...props}
                id={props.id}
                icon={MousePointerIcon}
                name="When clicking 'Execute Workflow'"
                onSettingsClick={() => { setActiveNodeId(props.id) }}
                onDoubleClick={() => { setActiveNodeId(props.id) }}
                status={status}
            />
        </>
    )
})