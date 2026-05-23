'use client'

import Link from 'next/link'
import { CheckCircle2, XCircle, Activity, Circle } from 'lucide-react'
import { formatDistanceToNowStrict } from 'date-fns'
import { useLatestExecutionForWorkflow } from '@/features/executions/hooks/use-executions'

interface LastRunChipProps {
    workflowId: string
}

export const LastRunChip = ({ workflowId }: LastRunChipProps) => {
    const { data, isLoading } = useLatestExecutionForWorkflow(workflowId)

    if (isLoading || !data) return null

    const tone = data.status === 'COMPLETED' ? 'ok'
        : data.status === 'FAILED' ? 'fail'
        : data.status === 'RUNNING' ? 'live'
        : 'idle'

    const Icon = tone === 'ok' ? CheckCircle2
        : tone === 'fail' ? XCircle
        : tone === 'live' ? Activity
        : Circle

    const colorClass = tone === 'ok' ? 'text-emerald-500'
        : tone === 'fail' ? 'text-red-500'
        : tone === 'live' ? 'text-sky-400'
        : 'text-muted-foreground'

    const label = tone === 'ok' ? 'Last run succeeded'
        : tone === 'fail' ? 'Last run failed'
        : tone === 'live' ? 'Run in progress'
        : 'Last run'

    const when = formatDistanceToNowStrict(
        new Date(data.completedAt ?? data.startedAt),
        { addSuffix: true },
    )

    return (
        <Link
            href={`/executions/${data.id}`}
            title={`${label} · view in executions`}
            className="flex h-5 items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
        >
            <Icon className={`h-3 w-3 ${colorClass} ${tone === 'live' ? 'animate-pulse' : ''}`} />
            <span>{when}</span>
        </Link>
    )
}
