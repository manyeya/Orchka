'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import Image from 'next/image'
import { isTriggerNode } from '@orchka/nodes/core'
import {
    NODE_PALETTE_ROOT,
    flattenLeaves,
    type NodePaletteEntry,
    type NodePaletteFolder,
    type NodePaletteLeaf,
} from '@orchka/nodes/editor'
import { Input } from '@orchka/ui/input'

const HIDDEN_TOP_LEVEL_IDS = new Set(['triggers', 'tools'])

interface CategoryGroup {
    id: string
    label: string
    items: NodePaletteLeaf[]
}

const buildCategoryGroups = (): CategoryGroup[] =>
    NODE_PALETTE_ROOT.filter(
        (entry): entry is NodePaletteFolder =>
            entry.kind === 'folder' && !HIDDEN_TOP_LEVEL_IDS.has(entry.id),
    ).map((folder) => ({
        id: folder.id,
        label: folder.label,
        items: flattenLeaves(folder.children).filter(
            (leaf) => !isTriggerNode(leaf.type as string),
        ),
    })).filter((group) => group.items.length > 0)

interface ConnectEndNodePickerProps {
    /** Screen coordinates where the picker should be anchored (top-left corner). */
    position: { x: number; y: number }
    onSelect: (leaf: NodePaletteLeaf) => void
    onClose: () => void
}

export const ConnectEndNodePicker = ({ position, onSelect, onClose }: ConnectEndNodePickerProps) => {
    const [query, setQuery] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)

    const groups = useMemo(buildCategoryGroups, [])

    const filteredGroups = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return groups
        return groups
            .map((group) => ({
                ...group,
                items: group.items.filter((node) =>
                    node.label.toLowerCase().includes(q) ||
                    node.description?.toLowerCase().includes(q) ||
                    node.tags?.some((tag) => tag.toLowerCase().includes(q)),
                ),
            }))
            .filter((group) => group.items.length > 0)
    }, [groups, query])

    const flatItems = useMemo(
        () => filteredGroups.flatMap((g) => g.items),
        [filteredGroups],
    )

    useEffect(() => {
        setActiveIndex(0)
    }, [query])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
            return
        }
        if (event.key === 'Enter') {
            event.preventDefault()
            const target = flatItems[activeIndex]
            if (target) onSelect(target)
            return
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex((i) => Math.min(i + 1, Math.max(flatItems.length - 1, 0)))
            return
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex((i) => Math.max(i - 1, 0))
        }
    }

    const clampedPosition = useMemo(() => {
        if (typeof window === 'undefined') return position
        const width = 320
        const height = 420
        const margin = 8
        return {
            x: Math.min(position.x, window.innerWidth - width - margin),
            y: Math.min(position.y, window.innerHeight - height - margin),
        }
    }, [position])

    let runningIndex = 0

    return (
        <div
            ref={containerRef}
            className="fixed z-50 flex max-h-[420px] w-80 flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg"
            style={{ left: clampedPosition.x, top: clampedPosition.y }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="border-b p-2">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        autoFocus
                        placeholder="Search nodes..."
                        className="h-9 pl-8"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-1">
                {filteredGroups.length === 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                        No nodes found
                    </div>
                )}

                {filteredGroups.map((group) => (
                    <div key={group.id} className="mb-2 last:mb-0">
                        <div className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            {group.label}
                        </div>
                        <div className="flex flex-col">
                            {group.items.map((node) => {
                                const currentIndex = runningIndex++
                                const isActive = currentIndex === activeIndex
                                return (
                                    <NodeRow
                                        key={node.type}
                                        node={node}
                                        active={isActive}
                                        onMouseEnter={() => setActiveIndex(currentIndex)}
                                        onClick={() => onSelect(node)}
                                    />
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

interface NodeRowProps {
    node: NodePaletteLeaf
    active: boolean
    onMouseEnter: () => void
    onClick: () => void
}

const NodeRow = ({ node, active, onMouseEnter, onClick }: NodeRowProps) => {
    const Icon = node.icon
    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${
                active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
            }`}
        >
            <span className="flex size-5 shrink-0 items-center justify-center">
                {typeof Icon === 'string' ? (
                    <Image src={Icon} alt={node.label} className="size-4 object-contain" />
                ) : (
                    <Icon className="size-4 text-primary" />
                )}
            </span>
            <span className="flex-1 truncate">{node.label}</span>
        </button>
    )
}

export type { NodePaletteLeaf as ConnectEndPickerLeaf }
