'use client'
import { createId } from "@paralleldrive/cuid2"
import { useReactFlow } from "@xyflow/react"
import { useCallback } from "react"
import { toast } from "sonner"
import { GlobeIcon, MousePointerIcon, GitBranch, GitMerge, Repeat, Clock, Bot } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, } from "@/components/ui/sheet"
import { NodeType } from "@/features/nodes/types"
import Image from "next/image"
import { Item, ItemContent, ItemMedia, ItemTitle, ItemDescription } from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { generateUniqueNodeName, getNodeNames } from "@/features/editor/utils/graph-validation"

interface NodeTypeOption {
    type: NodeType
    label: string
    description?: string
    icon: React.ComponentType<{ className?: string }> | string
}

const TRIGGER_NODES: NodeTypeOption[] = [
    {
        type: NodeType.MANUAL_TRIGGER,
        label: "Manual Trigger",
        description: "Trigger a workflow manually",
        icon: MousePointerIcon
    }
]

const ACTION_NODES: NodeTypeOption[] = [
    {
        type: NodeType.HTTP_REQUEST,
        label: "HTTP Request",
        description: "Make an HTTP request",
        icon: GlobeIcon
    },
    {
        type: NodeType.AI_AGENT,
        label: "AI Agent",
        description: "LLM-powered agent with tools",
        icon: Bot
    }
]

const CONTROL_NODES: NodeTypeOption[] = [
    {
        type: NodeType.IF_CONDITION,
        label: "If",
        description: "Branch based on a condition",
        icon: GitBranch
    },
    {
        type: NodeType.SWITCH,
        label: "Switch",
        description: "Route to multiple paths based on a value",
        icon: GitMerge
    },
    {
        type: NodeType.LOOP,
        label: "Loop",
        description: "Iterate over an array or count",
        icon: Repeat
    },
    {
        type: NodeType.WAIT,
        label: "Wait",
        description: "Pause execution for a duration or until a time",
        icon: Clock
    }
]

interface NodeSelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

export const NodeSelector = ({ open, onOpenChange, children }: NodeSelectorProps) => {
    const { setNodes, getNodes, screenToFlowPosition } = useReactFlow()

    const handleNodeSelect = useCallback((selection: NodeTypeOption) => {
        if (selection.type === NodeType.MANUAL_TRIGGER) {
            const nodes = getNodes()
            const hasManualTrigger = nodes.some((node) => node.type === selection.type)
            if (hasManualTrigger) {
                toast.error("Only one manual trigger is allowed")
                return;
            }
        }

        setNodes((nodes) => {
            const hasInitialTrigger = nodes.some((node) => node.type === NodeType.INITIAL)
            const centerX = window.innerWidth / 2
            const centerY = window.innerHeight / 2
            const flowPosition = screenToFlowPosition({ x: centerX + (Math.random() - 0.5) * 200, y: centerY + (Math.random() - 0.5) * 200 })

            // Generate unique name based on existing node names
            const existingNames = getNodeNames(nodes)
            const uniqueName = generateUniqueNodeName(selection.label, existingNames)

            const newNode = {
                id: createId(),
                type: selection.type,
                position: flowPosition,
                data: {
                    label: selection.label,
                    name: uniqueName
                }
            }

            if (hasInitialTrigger) {
                return [newNode]
            }

            return [
                ...nodes,
                newNode
            ]
        });
        onOpenChange(false)

    }, [setNodes, getNodes, screenToFlowPosition, onOpenChange,])
    return (
        <Sheet open={open} onOpenChange={onOpenChange} >
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
                <div className="flex flex-col gap-4">
                    <SheetHeader>
                        <SheetTitle>What Triggers this Workflow?</SheetTitle>
                        <SheetDescription>
                            Select a node to trigger this workflow
                        </SheetDescription>
                    </SheetHeader>
                    {TRIGGER_NODES.map((node) => {
                        const Icon = node.icon
                        return (
                            <Item className="hover:bg-accent/50 cursor-pointer" onClick={() => {
                                handleNodeSelect(node)
                            }} key={node.type}>
                                <ItemMedia>
                                    {typeof Icon === 'string' ? (
                                        <Image src={Icon} alt={node.label} objectFit="contain" className="size-6" />
                                    ) : (
                                        <Icon className="size-6" />
                                    )}
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle>{node.label}</ItemTitle>
                                    {node.description && (
                                        <ItemDescription>{node.description}</ItemDescription>
                                    )}
                                </ItemContent>
                            </Item>
                        )
                    })}
                </div>
                <Separator className="my-4" />

                <div className="flex flex-col gap-4">
                    <SheetHeader>
                        <SheetTitle>Actions This Workflow Perform</SheetTitle>
                        <SheetDescription>
                            Select a node to perform an action
                        </SheetDescription>
                    </SheetHeader>
                    {ACTION_NODES.map((node) => {
                        const Icon = node.icon
                        return (
                            <Item className="hover:bg-accent/50 cursor-pointer" onClick={() => { handleNodeSelect(node) }} key={node.type}>
                                <ItemMedia>
                                    {typeof Icon === 'string' ? (
                                        <Image src={Icon} alt={node.label} objectFit="contain" className="size-6" />
                                    ) : (
                                        <Icon className="size-6" />
                                    )}
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle>{node.label}</ItemTitle>
                                    {node.description && (
                                        <ItemDescription>{node.description}</ItemDescription>
                                    )}
                                </ItemContent>
                            </Item>
                        )
                    })}
                </div>

                <Separator className="my-4" />

                <div className="flex flex-col gap-4">
                    <SheetHeader>
                        <SheetTitle>Control Flow</SheetTitle>
                        <SheetDescription>
                            Control the flow of your workflow
                        </SheetDescription>
                    </SheetHeader>
                    {CONTROL_NODES.map((node) => {
                        const Icon = node.icon
                        return (
                            <Item className="hover:bg-accent/50 cursor-pointer" onClick={() => { handleNodeSelect(node) }} key={node.type}>
                                <ItemMedia>
                                    {typeof Icon === 'string' ? (
                                        <Image src={Icon} alt={node.label} objectFit="contain" className="size-6" />
                                    ) : (
                                        <Icon className="size-6" />
                                    )}
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle>{node.label}</ItemTitle>
                                    {node.description && (
                                        <ItemDescription>{node.description}</ItemDescription>
                                    )}
                                </ItemContent>
                            </Item>
                        )
                    })}
                </div>
            </SheetContent>
        </Sheet>
    )
}
