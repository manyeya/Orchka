"use client"

import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { useSuspenseWorkflows, useCreateWorkflow, useRemoveWorkflow } from "../hooks/use-workflows"
import {
    useSuspenseExecutionsStats,
} from "@/features/executions/hooks/use-executions"
import {
    ExecutionsChart,
    ExecutionsChartSkeleton,
} from "@/features/executions/components/executions-chart"
import {
    AlertTriangle,
    ArrowDownAZ,
    ArrowDownUp,
    ArrowUpAZ,
    BarChart3,
    Clock,
    FolderCode,
    MoreVerticalIcon,
    Search,
    Trash2,
} from "lucide-react"
import { cn } from "@orchka/ui/utils"

import { EntityList, EntityPagination, LoadingView, ErrorView } from "@/components/entity-component"
import { useUpgradeModal } from "@/features/payments/hooks/use-upgrade-modal"
import { useWorkflowsParams } from "../hooks/use-workflows-params"
import { useEntitySearch } from "@/hooks/use-entity-search"
import { useRouter } from "next/navigation"
import type { Workflow } from "@orchka/db/client"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@orchka/ui/card"
import { Button } from "@orchka/ui/button"
import { Input } from "@orchka/ui/input"
import { Badge } from "@orchka/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@orchka/ui/dropdown-menu"
import Link from "next/link"
import { Switch } from "@orchka/ui/switch"

export const WorkflowsList = () => {
    const workflows = useSuspenseWorkflows()

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <EntityList
                    className="gap-px bg-border/40"
                    items={workflows.data.items}
                    render={(workflow) => (
                        <WorkflowsItem workflow={workflow} />
                    )}
                    getKey={(workflow) => workflow.id}
                    emptyView={<WorkflowsEmptyView />}
                />
            </div>
            {workflows.data.items.length > 0 && <WorkflowsPagination />}
        </div>
    )
}

const StatsCard = ({ title, value, subtext }: { title: string, value: string, subtext: string }) => (
    <Card className="rounded-lg bg-card/50 border-border/50 shadow-sm backdrop-blur-sm w-full">
        <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        </CardContent>
    </Card>
)

const formatDurationMs = (ms: number | null): string => {
    if (ms == null) return "—"
    if (ms < 1000) return `${ms}ms`
    const seconds = ms / 1000
    if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`
    const minutes = Math.floor(seconds / 60)
    const remSec = Math.round(seconds - minutes * 60)
    return `${minutes}m ${remSec}s`
}

const WorkflowsStatsSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="rounded-lg bg-card/50 border-border/50 shadow-sm w-full">
                <CardHeader className="p-4 pb-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="h-7 w-16 animate-pulse rounded bg-muted" />
                    <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted/70" />
                </CardContent>
            </Card>
        ))}
    </div>
)

const WorkflowsStats = () => {
    const { data: stats } = useSuspenseExecutionsStats(30)
    const windowLabel = stats.windowDays === 1 ? "Last 24h" : `Last ${stats.windowDays} days`
    const finished = stats.succeeded + stats.failed
    const failureRate = finished > 0 ? `${Math.round((stats.failed / finished) * 100)}%` : "—"
    const avgRun = formatDurationMs(stats.avgDurationMs)
    // Rough "time saved" proxy: each successful run × avg run time. Replace
    // when we have manual-runtime estimates on workflows.
    const timeSavedMs =
        stats.avgDurationMs != null ? stats.succeeded * stats.avgDurationMs : null
    const timeSaved = timeSavedMs == null ? "—" : formatDurationMs(timeSavedMs)

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatsCard
                title="Prod. executions"
                value={stats.succeeded.toLocaleString()}
                subtext={windowLabel}
            />
            <StatsCard
                title="Failed prod. executions"
                value={stats.failed.toLocaleString()}
                subtext={windowLabel}
            />
            <StatsCard title="Failure rate" value={failureRate} subtext={windowLabel} />
            <StatsCard title="Time saved" value={timeSaved} subtext={windowLabel} />
            <StatsCard title="Run time (avg.)" value={avgRun} subtext={windowLabel} />
        </div>
    )
}

const ChartLegendDot = ({ color, label }: { color: string; label: string }) => (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="size-2" style={{ backgroundColor: color }} aria-hidden />
        {label}
    </span>
)

const WorkflowsOverviewErrorFallback = ({ error }: { error: unknown }) => {
    const message =
        error instanceof Error && error.message
            ? error.message
            : "The stats query rejected. If you just added the rollup table, restart the dev server so the Prisma client picks up the new model."
    return (
        <div className="flex items-start gap-3 border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="space-y-1">
                <p className="font-medium text-destructive">Overview failed to load</p>
                <p className="text-xs text-muted-foreground">{message}</p>
            </div>
        </div>
    )
}

const WorkflowsOverview = () => {
    return (
        <section className="overflow-hidden rounded-md border border-border/60 bg-card/40">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <BarChart3 className="size-3.5 text-muted-foreground" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                        overview
                    </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    last 30 days
                </span>
            </div>

            <div className="space-y-5 p-4 md:p-5">
                <ErrorBoundary FallbackComponent={WorkflowsOverviewErrorFallback}>
                    <Suspense fallback={<WorkflowsStatsSkeleton />}>
                        <WorkflowsStats />
                    </Suspense>
                </ErrorBoundary>

                <div className="space-y-3 rounded-md border border-border/60 bg-background/60 p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Daily activity
                        </h3>
                        <div className="flex items-center gap-4">
                            <ChartLegendDot color="var(--primary)" label="succeeded" />
                            <ChartLegendDot color="var(--destructive)" label="failed" />
                        </div>
                    </div>
                    <ErrorBoundary FallbackComponent={WorkflowsOverviewErrorFallback}>
                        <Suspense fallback={<ExecutionsChartSkeleton />}>
                            <ExecutionsChart />
                        </Suspense>
                    </ErrorBoundary>
                </div>
            </div>
        </section>
    )
}

const WorkflowsHeader = () => {
    const { isPending, mutate } = useCreateWorkflow()
    const { modal, handleError } = useUpgradeModal()
    return (
        <div className="flex flex-col gap-6 mb-8">
            {modal}
            <div className="flex flex-row items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
                    <p className="text-muted-foreground">All the workflows, credentials and executions you have access to</p>
                </div>
                <div>
                    <Button
                        onClick={() => mutate(undefined, {
                            onError: (error) => handleError(error)
                        })}
                        disabled={isPending}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                        Create Workflow
                    </Button>
                </div>
            </div>
            <WorkflowsOverview />
        </div>
    )
}



const WorkflowsToolbar = () => {
    const [params, setParams] = useWorkflowsParams()
    const { searchValue, onSearchChange } = useEntitySearch({ params, setParams })

    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search"
                    className="pl-9 bg-muted/50 border-input/50 h-9"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            <div className="ml-auto flex items-center gap-2">
                <WorkflowsSortMenu />
            </div>
        </div>
    )
}

const SORT_OPTIONS = [
    { value: "updated-desc", label: "Recently updated", icon: Clock },
    { value: "updated-asc", label: "Oldest updated", icon: Clock },
    { value: "created-desc", label: "Recently created", icon: ArrowDownUp },
    { value: "created-asc", label: "Oldest first", icon: ArrowDownUp },
    { value: "name-asc", label: "Name (A → Z)", icon: ArrowDownAZ },
    { value: "name-desc", label: "Name (Z → A)", icon: ArrowUpAZ },
] as const

const WorkflowsSortMenu = () => {
    const [params, setParams] = useWorkflowsParams()
    const current = params.sort ?? "updated-desc"
    const active =
        SORT_OPTIONS.find((opt) => opt.value === current) ?? SORT_OPTIONS[0]
    const isCustom = current !== "updated-desc"

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-9 gap-2 bg-background/50 border-input/50 font-mono text-xs uppercase tracking-[0.16em]",
                        isCustom && "border-primary/40 bg-primary/10 text-primary",
                    )}
                >
                    <active.icon className="h-3.5 w-3.5" />
                    <span className="whitespace-nowrap">{active.label}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Sort by
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                    value={current}
                    onValueChange={(value) => setParams({ ...params, sort: value, page: 1 })}
                >
                    {SORT_OPTIONS.map((opt) => (
                        <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

const WorkflowsPagination = () => {
    const [params, setParams] = useWorkflowsParams()
    const workflows = useSuspenseWorkflows()
    return (
        <EntityPagination
            page={workflows.data.page}
            totalPages={workflows.data.totalPages}
            count={workflows.data.count}
            pageSize={workflows.data.pageSize}
            onPageChange={(page) => setParams({ ...params, page })}
            disabled={workflows.isFetching}
        />
    )
}

export const WorkflowsContainer = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="w-full p-6 md:p-8 max-w-[1600px] mx-auto h-full bg-background text-foreground">
            <WorkflowsHeader />
            <WorkflowsToolbar />
            {children}
        </div>
    )
}

export const WorkflowsLoadingView = () => {
    return (
        <LoadingView entity="Workflows" />
    )
}

export const WorkflowsEmptyView = () => {
    const { isPending, mutate } = useCreateWorkflow()
    const { modal, handleError } = useUpgradeModal()
    const router = useRouter()
    return (
        <>
            {modal}
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/50 rounded-lg bg-muted/5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <FolderCode className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                    Create your first workflow to start automating your tasks.
                </p>
                <Button
                    onClick={() => mutate(undefined, {
                        onError: handleError,
                        onSuccess: (data) => router.push(`/workflows/${data.id}`)
                    })}
                    disabled={isPending}
                >
                    Create Workflow
                </Button>
            </div>
        </>
    )
}

export const WorkflowsErrorView = () => {
    return (
        <ErrorView entity="Workflows" />
    )
}

export const WorkflowsItem = ({ workflow }: { workflow: Workflow }) => {
    const { mutateAsync: removeWorkflow, isPending: isRemoving } = useRemoveWorkflow()

    return (
        <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 hover:bg-muted/30 transition-all bg-card/40 border-l-4 border-l-transparent hover:border-l-primary/50">
            <div className="flex-1 min-w-0 space-y-1">
                <Link href={`/workflows/${workflow.id}`} className="block">
                    <h3 className="text-sm font-semibold hover:text-primary transition-colors truncate">
                        {workflow.name}
                    </h3>
                </Link>
                <div className="flex items-center text-xs text-muted-foreground gap-2">
                    <span>Last updated {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}</span>
                    <span className="hidden sm:inline text-muted-foreground/40">|</span>
                    <span className="hidden sm:inline">Created {formatDistanceToNow(new Date(workflow.createdAt), { addSuffix: true })}</span>
                </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <Badge variant="secondary" className="gap-1 font-normal bg-secondary/50 hover:bg-secondary/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                    Personal
                </Badge>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-transparent">
                        <span className="text-xs text-muted-foreground font-medium">Active</span>
                        <Switch
                            checked={false} // TODO: Plug in real active state
                            onCheckedChange={() => { }}
                            className="scale-75 data-[state=checked]:bg-primary"
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVerticalIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/workflows/${workflow.id}`}>
                                    <FolderCode className="mr-2 h-4 w-4" />
                                    Open
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => removeWorkflow({ id: workflow.id })}
                                disabled={isRemoving}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}
