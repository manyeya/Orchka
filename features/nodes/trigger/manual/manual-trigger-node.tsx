"use client"

import { memo, useState, useCallback } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { NodeProps } from "@xyflow/react";
import { MousePointerIcon } from "lucide-react";
import { SettingsPortal } from "@/features/editor/components/settings-portal";
import { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { useSetAtom } from "jotai";
import { activeSettingsNodeIdAtom, updateNodeAtom } from "@/features/editor/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ManualTriggerData {
    name?: string;
    label?: string;
}

export const ManualTriggerNode = memo((props: NodeProps) => {
    const nodeData = props.data as ManualTriggerData;
    const setActiveNodeId = useSetAtom(activeSettingsNodeIdAtom);
    const updateNode = useSetAtom(updateNodeAtom);
    const [status, setStatus] = useState<NodeStatus>("initial");
    const [name, setName] = useState(nodeData.name || "Manual Trigger");

    const handleSave = useCallback(() => {
        updateNode({
            id: props.id,
            updates: {
                data: {
                    ...nodeData,
                    name: name
                }
            }
        });
        setActiveNodeId(null);
    }, [props.id, name, nodeData, updateNode, setActiveNodeId]);

    const handleCancel = useCallback(() => {
        setName(nodeData.name || "Manual Trigger");
        setActiveNodeId(null);
    }, [nodeData.name, setActiveNodeId]);

    return (
        <>
            <SettingsPortal nodeId={props.id}>
                <div className="p-4 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">Trigger Settings</h3>
                        <p className="text-sm text-muted-foreground">
                            Configure your manual trigger
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="trigger-name">Name</Label>
                        <Input
                            id="trigger-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Manual Trigger"
                        />
                        <p className="text-xs text-muted-foreground">
                            A unique name for this trigger in the workflow
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleSave}>
                            Save
                        </Button>
                    </div>
                </div>
            </SettingsPortal>
            <BaseTriggerNode
                {...props}
                id={props.id}
                icon={MousePointerIcon}
                name={nodeData.name || "Manual Trigger"}
                onSettingsClick={() => { setActiveNodeId(props.id) }}
                onDoubleClick={() => { setActiveNodeId(props.id) }}
                status={status}
            />
        </>
    )
})