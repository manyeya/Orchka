"use client"

import { memo, useState, useCallback } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { NodeProps } from "@xyflow/react";
import { MousePointerIcon } from "lucide-react";
import { NodeDetailModal, useNodeConfigActions } from "@orchka/nodes/editor";
import { Input } from "@orchka/ui/input";
import { Button } from "@orchka/ui/button";
import { Label } from "@orchka/ui/label";

interface ManualTriggerData {
    name?: string;
    label?: string;
}

export const ManualTriggerNode = memo((props: NodeProps) => {
    const nodeData = props.data as ManualTriggerData;
    const { status, openModal, closeModal, updateNode } = useNodeConfigActions(props.id);
    const [name, setName] = useState(nodeData.name || "Manual Trigger");

    const handleSave = useCallback(() => {
        updateNode({
            data: {
                ...nodeData,
                name,
            },
        });
        closeModal();
    }, [closeModal, name, nodeData, updateNode]);

    const handleCancel = useCallback(() => {
        setName(nodeData.name || "Manual Trigger");
        closeModal();
    }, [closeModal, nodeData.name]);

    return (
        <>
            <NodeDetailModal
                nodeId={props.id}
                nodeName={nodeData.name || "Manual Trigger"}
                nodeIcon={<MousePointerIcon className="size-5" />}
            >
                <div className="space-y-4">
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
            </NodeDetailModal>
            <BaseTriggerNode
                {...props}
                id={props.id}
                icon={MousePointerIcon}
                name={nodeData.name || "Manual Trigger"}
                onSettingsClick={openModal}
                onDoubleClick={openModal}
                status={status}
            />
        </>
    )
})
