'use client'
import { createId } from "@paralleldrive/cuid2"
import { useReactFlow } from "@xyflow/react"
import { useCallback, useState, useMemo } from "react"
import { toast } from "sonner"
import { GlobeIcon, MousePointerIcon, GitBranch, GitMerge, Repeat, Clock, Bot, Search, StickyNote, Grid2X2 } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, } from "@/components/ui/sheet"
import { NodeType } from "@/features/nodes/types"
import Image from "next/image"
import { Item, ItemContent, ItemMedia, ItemTitle, ItemDescription } from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { generateUniqueNodeName, getNodeNames } from "@/features/editor/utils/graph-validation"
import { Input } from "@/components/ui/input"

interface NodeTypeOption {
    type: NodeType
    label: string
    description?: string
    icon: React.ComponentType<{ className?: string }> | string
    tags?: string[]
}

const TRIGGER_NODES: NodeTypeOption[] = [
    {
        type: NodeType.MANUAL_TRIGGER,
        label: "Manual Trigger",
        description: "Trigger a workflow manually",
        icon: MousePointerIcon,
        tags: ["trigger", "start"]
    }
]

const ACTION_NODES: NodeTypeOption[] = [
    {
        type: NodeType.HTTP_REQUEST,
        label: "HTTP Request",
        description: "Make an HTTP request",
        icon: GlobeIcon,
        tags: ["api", "fetch", "external"]
    },
    {
        type: NodeType.AI_AGENT,
        label: "AI Agent",
        description: "LLM-powered agent with tools",
        icon: Bot,
        tags: ["ai", "llm", "bot"]
    }
]

const CONTROL_NODES: NodeTypeOption[] = [
    {
        type: NodeType.IF_CONDITION,
        label: "If",
        description: "Branch based on a condition",
        icon: GitBranch,
        tags: ["logic", "branch"]
    },
    {
        type: NodeType.SWITCH,
        label: "Switch",
        description: "Route to multiple paths based on a value",
        icon: GitMerge,
        tags: ["logic", "route"]
    },
    {
        type: NodeType.LOOP,
        label: "Loop",
        description: "Iterate over an array or count",
        icon: Repeat,
        tags: ["iteration", "foreach"]
    },
    {
        type: NodeType.WAIT,
        label: "Wait",
        description: "Pause execution for a duration or until a time",
        icon: Clock,
        tags: ["delay", "timer"]
    }
]

const TOOL_NODES: NodeTypeOption[] = [
    {
        type: NodeType.GROUP,
        label: "Group",
        description: "Group nodes together visually",
        icon: Grid2X2,
        tags: ["group", "organization", "container"]
    },
    {
        type: NodeType.ANNOTATION,
        label: "Note",
        description: "Add comments or instructions",
        icon: StickyNote,
        tags: ["note", "comment", "annotation", "text"]
    }
]

interface NodeSelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

export const NodeSelector = ({ open, onOpenChange, children }: NodeSelectorProps) => {
    const { setNodes, getNodes, screenToFlowPosition } = useReactFlow()
    const [searchQuery, setSearchQuery] = useState("")

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
                zIndex: selection.type === NodeType.GROUP ? -1 : undefined,
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
        setSearchQuery("") // Reset search on close

    }, [setNodes, getNodes, screenToFlowPosition, onOpenChange])

    const filterNodes = (nodes: NodeTypeOption[]) => {
        if (!searchQuery) return nodes
        const lowerQuery = searchQuery.toLowerCase()
        return nodes.filter(node =>
            node.label.toLowerCase().includes(lowerQuery) ||
            node.description?.toLowerCase().includes(lowerQuery) ||
            node.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        )
    }

    const filteredTriggerNodes = useMemo(() => filterNodes(TRIGGER_NODES), [searchQuery])
    const filteredActionNodes = useMemo(() => filterNodes(ACTION_NODES), [searchQuery])
    const filteredControlNodes = useMemo(() => filterNodes(CONTROL_NODES), [searchQuery])
    const filteredToolNodes = useMemo(() => filterNodes(TOOL_NODES), [searchQuery])

    const hasResults = filteredTriggerNodes.length > 0 || filteredActionNodes.length > 0 || filteredControlNodes.length > 0 || filteredToolNodes.length > 0

    return (
        <Sheet open={open} onOpenChange={onOpenChange} >
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent side="left" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
                <div className="p-6 pb-2 border-b">
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
                        <div className="text-center py-8 text-muted-foreground">
                            No nodes found matching "{searchQuery}"
                        </div>
                    )}

                    {filteredTriggerNodes.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Triggers</h3>
                            <div className="flex flex-col gap-2">
                                {filteredTriggerNodes.map((node) => (
                                    <NodeItem key={node.type} node={node} onClick={() => handleNodeSelect(node)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredActionNodes.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Actions</h3>
                            <div className="flex flex-col gap-2">
                                {filteredActionNodes.map((node) => (
                                    <NodeItem key={node.type} node={node} onClick={() => handleNodeSelect(node)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredControlNodes.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Flow Control</h3>
                            <div className="flex flex-col gap-2">
                                {filteredControlNodes.map((node) => (
                                    <NodeItem key={node.type} node={node} onClick={() => handleNodeSelect(node)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredToolNodes.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Tools & Organization</h3>
                            <div className="flex flex-col gap-2">
                                {filteredToolNodes.map((node) => (
                                    <NodeItem key={node.type} node={node} onClick={() => handleNodeSelect(node)} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

const NodeItem = ({ node, onClick }: { node: NodeTypeOption, onClick: () => void }) => {
    const Icon = node.icon
    return (
        <Item className="hover:bg-accent/50 cursor-pointer border rounded-md transition-colors" onClick={onClick}>
            <ItemMedia className="mt-0.5">
                {typeof Icon === 'string' ? (
                    <Image src={Icon} alt={node.label} objectFit="contain" className="size-5" />
                ) : (
                    <Icon className="size-5 text-primary" />
                )}
            </ItemMedia>
            <ItemContent>
                <div className="flex items-center gap-2">
                    <ItemTitle className="text-sm font-medium">{node.label}</ItemTitle>
                </div>
                {node.description && (
                    <ItemDescription className="text-xs line-clamp-1">{node.description}</ItemDescription>
                )}
            </ItemContent>
        </Item>
    )
}
