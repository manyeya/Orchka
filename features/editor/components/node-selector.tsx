'use client'
import { createId } from "@paralleldrive/cuid2"
import { useReactFlow } from "@xyflow/react"
import { useCallback } from "react"
import { toast } from "sonner"
import { GlobeIcon, MousePointerIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, } from "@/components/ui/sheet"
import { NodeType } from "@/lib/generated/prisma/enums"
import Image from "next/image"
import { Item, ItemContent, ItemMedia, ItemTitle, ItemDescription } from "@/components/ui/item"
import { Separator } from "@radix-ui/react-separator"

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
            const newNode = {
                id: createId(),
                type: selection.type,
                position: flowPosition,
                data: {
                    label: selection.label
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
                <Separator className="border-accent" />

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
            </SheetContent>
        </Sheet>
    )
}
