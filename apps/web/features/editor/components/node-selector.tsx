'use client'

import { createId } from "@paralleldrive/cuid2"
import { useReactFlow } from "@xyflow/react"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { NodeType } from "@orchka/nodes/core"
import {
    NODE_PALETTE_ROOT,
    findFolder,
    flattenLeaves,
    type NodePaletteEntry,
    type NodePaletteFolder,
    type NodePaletteLeaf,
} from "@orchka/nodes/editor"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@orchka/ui/sheet"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@orchka/ui/item"
import { Input } from "@orchka/ui/input"
import { Button } from "@orchka/ui/button"
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
    const [path, setPath] = useState<string[]>([])

    const resetNavigation = useCallback(() => {
        setSearchQuery("")
        setPath([])
    }, [])

    const handleOpenChange = useCallback((next: boolean) => {
        if (!next) resetNavigation()
        onOpenChange(next)
    }, [onOpenChange, resetNavigation])

    const handleNodeSelect = useCallback((selection: NodePaletteLeaf) => {
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
        resetNavigation()
    }, [getNodes, onOpenChange, resetNavigation, screenToFlowPosition, setNodes])

    const allLeaves = useMemo(() => flattenLeaves(NODE_PALETTE_ROOT), [])

    const currentFolder = useMemo<NodePaletteFolder | null>(
        () => (path.length === 0 ? null : findFolder(NODE_PALETTE_ROOT, path)),
        [path],
    )

    const currentEntries = useMemo<NodePaletteEntry[]>(
        () => currentFolder?.children ?? NODE_PALETTE_ROOT,
        [currentFolder],
    )

    const searchResults = useMemo<NodePaletteLeaf[]>(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return []
        return allLeaves.filter((node) =>
            node.label.toLowerCase().includes(q) ||
            node.description?.toLowerCase().includes(q) ||
            node.tags?.some((tag) => tag.toLowerCase().includes(q)),
        )
    }, [allLeaves, searchQuery])

    const isSearching = searchQuery.trim().length > 0

    const handleFolderEnter = useCallback((folder: NodePaletteFolder) => {
        setPath((prev) => [...prev, folder.id])
    }, [])

    const handleBack = useCallback(() => {
        setPath((prev) => prev.slice(0, -1))
    }, [])

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent side="left" className="w-full gap-0 p-0 sm:max-w-md">
                <div className="border-b p-6 pb-2">
                    <SheetHeader className="mb-4">
                        {currentFolder && !isSearching ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleBack}
                                    aria-label="Back"
                                    className="size-7 shrink-0"
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <SheetTitle className="truncate">{currentFolder.label}</SheetTitle>
                            </div>
                        ) : (
                            <SheetTitle>Add Node</SheetTitle>
                        )}
                        <SheetDescription>
                            {currentFolder && !isSearching
                                ? (currentFolder.description ?? "Select a node to add to your workflow")
                                : "Select a node to add to your workflow"}
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

                <div className="flex-1 overflow-y-auto p-6 pt-4">
                    {isSearching ? (
                        searchResults.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                No nodes found matching &quot;{searchQuery}&quot;
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {searchResults.map((node) => (
                                    <NodeItem
                                        key={node.type}
                                        node={node}
                                        onClick={() => handleNodeSelect(node)}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col gap-2">
                            {currentEntries.map((entry) =>
                                entry.kind === "folder" ? (
                                    <FolderItem
                                        key={entry.id}
                                        folder={entry}
                                        onClick={() => handleFolderEnter(entry)}
                                    />
                                ) : (
                                    <NodeItem
                                        key={entry.type}
                                        node={entry}
                                        onClick={() => handleNodeSelect(entry)}
                                    />
                                ),
                            )}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

const NodeItem = ({ node, onClick }: { node: NodePaletteLeaf, onClick: () => void }) => {
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

const FolderItem = ({ folder, onClick }: { folder: NodePaletteFolder, onClick: () => void }) => {
    const Icon = folder.icon
    const childCount = folder.children.length

    return (
        <Item
            className="cursor-pointer rounded-md border transition-colors hover:bg-accent/50"
            onClick={onClick}
        >
            <ItemMedia className="mt-0.5">
                {typeof Icon === 'string' ? (
                    <Image src={Icon} alt={folder.label} className="size-5 object-contain" />
                ) : (
                    <Icon className="size-5 text-primary" />
                )}
            </ItemMedia>
            <ItemContent>
                <div className="flex items-center gap-2">
                    <ItemTitle className="text-sm font-medium">{folder.label}</ItemTitle>
                    <span className="text-xs text-muted-foreground">
                        {childCount} {childCount === 1 ? "item" : "items"}
                    </span>
                </div>
                {folder.description && (
                    <ItemDescription className="line-clamp-1 text-xs">
                        {folder.description}
                    </ItemDescription>
                )}
            </ItemContent>
            <ChevronRight className="size-4 self-center text-muted-foreground" />
        </Item>
    )
}
