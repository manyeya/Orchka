'use client'

import { useState, useMemo } from 'react'
import { NodeToolbar, Position } from '@xyflow/react'
import { useAtomValue } from 'jotai'
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { nodeStatusesAtom, nodeExecutionDataAtom } from '../store'

/**
 * Renders a red error chip below every node whose last execution failed.
 * Reads from the global atoms (populated by RealtimeManager during a live run,
 * and by the editor hydration on workflow load), then uses NodeToolbar's
 * `nodeId` prop to position itself relative to each failed node without
 * touching any of the individual node components.
 */
export const NodeErrorOverlays = () => {
    const statuses = useAtomValue(nodeStatusesAtom)
    const execData = useAtomValue(nodeExecutionDataAtom)

    const failedNodeIds = useMemo(
        () => Object.keys(statuses).filter(id => statuses[id] === 'error'),
        [statuses],
    )

    if (failedNodeIds.length === 0) return null

    return (
        <>
            {failedNodeIds.map(nodeId => (
                <NodeErrorChip
                    key={nodeId}
                    nodeId={nodeId}
                    error={execData[nodeId]?.error ?? null}
                />
            ))}
        </>
    )
}

const NodeErrorChip = ({ nodeId, error }: { nodeId: string; error: string | null }) => {
    const [expanded, setExpanded] = useState(false)
    const message = error?.trim() || 'Execution failed'
    const hasMore = message.length > 70 || message.includes('\n')

    return (
        <NodeToolbar
            nodeId={nodeId}
            isVisible
            position={Position.Bottom}
            // Push past the WorkflowNode's own bottom toolbar (name + status icon)
            // so the error message sits below the X, not above the name.
            offset={90}
            className="pointer-events-auto z-20"
        >
            <div
                className={`group flex max-w-[240px] items-start gap-1.5 rounded-sm border-l-2 border-red-500/70 bg-red-500/[0.04] py-1 pl-2 pr-1.5 text-left transition-colors hover:bg-red-500/[0.07] ${hasMore ? 'cursor-pointer' : ''}`}
                onClick={() => hasMore && setExpanded(prev => !prev)}
                role={hasMore ? 'button' : undefined}
                title={hasMore && !expanded ? 'Click to expand' : undefined}
            >
                <AlertCircle className="mt-[1px] h-3 w-3 shrink-0 text-red-400/90" />
                <p
                    className={`flex-1 whitespace-pre-wrap break-words font-mono text-[10px] leading-snug text-red-200/85 ${expanded ? '' : 'line-clamp-2'}`}
                >
                    {message}
                </p>
                {hasMore && (
                    <span className="mt-[1px] text-red-300/50 opacity-0 transition-opacity group-hover:opacity-100">
                        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </span>
                )}
            </div>
        </NodeToolbar>
    )
}
