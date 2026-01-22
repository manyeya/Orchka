"use client"

import { memo, useState, useCallback, useEffect } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { NodeProps } from "@xyflow/react";
import { ClockIcon } from "lucide-react";
import { NodeDetailModal } from "@/features/editor/components/node-detail-modal";
import { useSetAtom } from "jotai";
import { activeNodeModalIdAtom, updateNodeAtom } from "@/features/editor/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNodeStatus } from "../../utils/use-node-status";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CronTriggerData {
    name?: string;
    cronPattern?: string;
    timezone?: string;
    enabled?: boolean;
}

const COMMON_CRON_PATTERNS = [
    { label: "Every minute", value: "* * * * *" },
    { label: "Every 5 minutes", value: "*/5 * * * *" },
    { label: "Every 15 minutes", value: "*/15 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every day at midnight", value: "0 0 * * *" },
    { label: "Every day at noon", value: "0 12 * * *" },
    { label: "Every Monday at 9am", value: "0 9 * * 1" },
    { label: "Every weekday at 9am", value: "0 9 * * 1-5" },
    { label: "First day of month", value: "0 0 1 * *" },
    { label: "Custom", value: "custom" },
];

const COMMON_TIMEZONES = [
    "UTC",
    "America/New_York",
    "America/Los_Angeles",
    "America/Chicago",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
    "Africa/Johannesburg",
];

export const CronTriggerNode = memo((props: NodeProps) => {
    const nodeData = props.data as CronTriggerData;
    const setActiveNodeId = useSetAtom(activeNodeModalIdAtom);
    const updateNode = useSetAtom(updateNodeAtom);
    const status = useNodeStatus({
        nodeId: props.id,
    });

    const [name, setName] = useState(nodeData.name || "Cron Trigger");
    const [cronPattern, setCronPattern] = useState(nodeData.cronPattern || "0 * * * *");
    const [timezone, setTimezone] = useState(nodeData.timezone || "UTC");
    const [selectedPreset, setSelectedPreset] = useState<string>(() => {
        const match = COMMON_CRON_PATTERNS.find(p => p.value === nodeData.cronPattern);
        return match ? match.value : "custom";
    });

    // Sync state when nodeData changes
    useEffect(() => {
        setName(nodeData.name || "Cron Trigger");
        setCronPattern(nodeData.cronPattern || "0 * * * *");
        setTimezone(nodeData.timezone || "UTC");
        const match = COMMON_CRON_PATTERNS.find(p => p.value === nodeData.cronPattern);
        setSelectedPreset(match ? match.value : "custom");
    }, [nodeData.name, nodeData.cronPattern, nodeData.timezone]);

    const handlePresetChange = useCallback((value: string) => {
        setSelectedPreset(value);
        if (value !== "custom") {
            setCronPattern(value);
        }
    }, []);

    const handleSave = useCallback(() => {
        updateNode({
            id: props.id,
            updates: {
                data: {
                    ...nodeData,
                    name: name,
                    cronPattern: cronPattern,
                    timezone: timezone,
                    enabled: true,
                }
            }
        });
        setActiveNodeId(null);
    }, [props.id, name, cronPattern, timezone, nodeData, updateNode, setActiveNodeId]);

    const handleCancel = useCallback(() => {
        setName(nodeData.name || "Cron Trigger");
        setCronPattern(nodeData.cronPattern || "0 * * * *");
        setTimezone(nodeData.timezone || "UTC");
        setActiveNodeId(null);
    }, [nodeData, setActiveNodeId]);

    const openModal = useCallback(() => {
        setActiveNodeId(props.id);
    }, [props.id, setActiveNodeId]);

    // Generate human-readable description of cron pattern
    const getCronDescription = (pattern: string): string => {
        const match = COMMON_CRON_PATTERNS.find(p => p.value === pattern);
        if (match && match.value !== "custom") {
            return match.label;
        }
        return pattern;
    };

    return (
        <>
            <NodeDetailModal
                nodeId={props.id}
                nodeName={nodeData.name || "Cron Trigger"}
                nodeIcon={<ClockIcon className="size-5" />}
            >
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">Cron Trigger Settings</h3>
                        <p className="text-sm text-muted-foreground">
                            Configure your scheduled workflow trigger
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="trigger-name">Name</Label>
                        <Input
                            id="trigger-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Cron Trigger"
                        />
                        <p className="text-xs text-muted-foreground">
                            A unique name for this trigger in the workflow
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cron-preset">Schedule Preset</Label>
                        <Select value={selectedPreset} onValueChange={handlePresetChange}>
                            <SelectTrigger id="cron-preset">
                                <SelectValue placeholder="Select a schedule" />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMON_CRON_PATTERNS.map((pattern) => (
                                    <SelectItem key={pattern.value} value={pattern.value}>
                                        {pattern.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cron-pattern">Cron Expression</Label>
                        <Input
                            id="cron-pattern"
                            value={cronPattern}
                            onChange={(e) => {
                                setCronPattern(e.target.value);
                                setSelectedPreset("custom");
                            }}
                            placeholder="* * * * *"
                            className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            Format: minute hour day-of-month month day-of-week
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger id="timezone">
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMON_TIMEZONES.map((tz) => (
                                    <SelectItem key={tz} value={tz}>
                                        {tz}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-md bg-muted p-3">
                        <p className="text-sm">
                            <span className="font-medium">Schedule: </span>
                            {getCronDescription(cronPattern)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Timezone: {timezone}
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
                icon={ClockIcon}
                name={nodeData.name || "Cron Trigger"}
                description={nodeData.cronPattern ? getCronDescription(nodeData.cronPattern) : undefined}
                onSettingsClick={openModal}
                onDoubleClick={openModal}
                status={status}
            />
        </>
    )
})
