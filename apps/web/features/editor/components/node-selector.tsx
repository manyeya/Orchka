'use client'

import { createId } from "@paralleldrive/cuid2"
import { useReactFlow } from "@xyflow/react"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { Search } from 'lucide-react'
import { NodeType } from "@orchka/nodes/core"
import { NODE_PALETTE_SECTIONS, type NodePaletteItem } from "@orchka/nodes/editor"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@orchka/ui/sheet"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@orchka/ui/item"
import { Input } from "@orchka/ui/input"
import Image from "next/image"

import { generateUniqueNodeName, getNodeNames } from "@/features/editor/utils/graph-validation"

interface NodeSelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

export const NodeSelector = ({ open, onOpenChange, children }: NodeSelectorProps) => {
    const { setNodes, getNodes, screenToFlowPosition } = useReactFlow()
    const [searchQuery, setSearchQuery] = useState("")

    const handleNodeSelect = useCallback((selection: NodePaletteItem) => {
        if (selection.type === NodeType.MANUAL_TRIGGER) {
            const nodes = getNodes()
            const hasManualTrigger = nodes.some((node) => node.type === selection.type)
            if (hasManualTrigger) {
                toast.error("Only one manual trigger is allowed")
                return
            }
        }

        setNodes((nodes) => {
            const hasInitialTrigger = nodes.some((node) => node.type === NodeType.INITIAL)
            const centerX = window.innerWidth / 2
            const centerY = window.innerHeight / 2
            const flowPosition = screenToFlowPosition({
                x: centerX + (Math.random() - 0.5) * 200,
                y: centerY + (Math.random() - 0.5) * 200,
            })

            const existingNames = getNodeNames(nodes)
            const uniqueName = generateUniqueNodeName(selection.label, existingNames)

            const newNode = {
                id: createId(),
                type: selection.type,
                position: flowPosition,
                zIndex: selection.type === NodeType.GROUP ? -1 : undefined,
                style: (selection.type === NodeType.GROUP || selection.type === NodeType.ANNOTATION)
                    ? { width: 200, height: 150 }
                    : undefined,
                data: {
                    label: selection.label,
                    name: uniqueName,
                },
            }

            if (hasInitialTrigger) {
                return [newNode]
            }

            return [...nodes, newNode]
        })

        onOpenChange(false)
        setSearchQuery("")
    }, [getNodes, onOpenChange, screenToFlowPosition, setNodes])

    const filterNodes = useCallback((items: NodePaletteItem[]) => {
        if (!searchQuery) return items
        const lowerQuery = searchQuery.toLowerCase()
        return items.filter((node) =>
            node.label.toLowerCase().includes(lowerQuery) ||
            node.description?.toLowerCase().includes(lowerQuery) ||
            node.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
        )
    }, [searchQuery])

    const filteredSections = useMemo(
        () =>
            NODE_PALETTE_SECTIONS.map((section) => ({
                ...section,
                items: filterNodes(section.items),
            })).filter((section) => section.items.length > 0),
        [filterNodes],
    )

    const hasResults = filteredSections.length > 0

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent side="left" className="w-full gap-0 p-0 sm:max-w-md">
                <div className="border-b p-6 pb-2">
                    <SheetHeader className="mb-4">
                        <SheetTitle>Add Node</SheetTitle>
                        <SheetDescription>
                            Select a node to add to your workflow
                        </SheetDescription>
                    </SheetHeader>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search nodes..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-2">
                    {!hasResults && (
                        <div className="py-8 text-center text-muted-foreground">
                            No nodes found matching "{searchQuery}"
                        </div>
                    )}

                    {filteredSections.map((section) => (
                        <div key={section.id} className="mb-6">
                            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                {section.label}
                            </h3>
                            <div className="flex flex-col gap-2">
                                {section.items.map((node) => (
                                    <NodeItem
                                        key={node.type}
                                        node={node}
                                        onClick={() => handleNodeSelect(node)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    )
}

const NodeItem = ({ node, onClick }: { node: NodePaletteItem, onClick: () => void }) => {
    const Icon = node.icon

    return (
        <Item
            className="cursor-pointer rounded-md border transition-colors hover:bg-accent/50"
            onClick={onClick}
        >
            <ItemMedia className="mt-0.5">
                {typeof Icon === 'string' ? (
                    <Image src={Icon} alt={node.label} className="size-5 object-contain" />
                ) : (
                    <Icon className="size-5 text-primary" />
                )}
            </ItemMedia>
            <ItemContent>
                <div className="flex items-center gap-2">
                    <ItemTitle className="text-sm font-medium">{node.label}</ItemTitle>
                </div>
                {node.description && (
                    <ItemDescription className="line-clamp-1 text-xs">
                        {node.description}
                    </ItemDescription>
                )}
            </ItemContent>
        </Item>
    )
}
