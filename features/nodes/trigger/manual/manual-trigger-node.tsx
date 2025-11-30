import { memo, useState } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { NodeProps } from "@xyflow/react";
import { MousePointerIcon } from "lucide-react";
import { SettingsSheet } from "@/features/editor/components/settings-sheet";
import { NodeStatus } from "@/components/react-flow/node-status-indicator";



export const ManualTriggerNode = memo((props: NodeProps) => {
    const [open, setOpen] = useState(false)
    const [status, setStatus] = useState<NodeStatus>("initial")
    return (
        <>
            <SettingsSheet open={open} onOpenChange={setOpen}>
                <div className="p-4">
                    <p className="text-muted-foreground">Manually Trigger the Workflow</p>
                </div>
            </SettingsSheet>
            <BaseTriggerNode
                {...props}
                id={props.id}
                icon={MousePointerIcon}
                name="When clicking 'Execute Workflow'"
                onSettingsClick={() => { setOpen(true) }}
                onDoubleClick={() => { }}
                status={status}
            />
        </>
    )
})