"use client"

import { useSuspenseWorkflows, useCreateWorkflow, useRemoveWorkflow } from "../hooks/use-workflows"
import { FolderCode, MoreVerticalIcon, Search, ListFilter, List as ListIcon, Trash2 } from "lucide-react"

import { EntityList, EntityPagination, LoadingView, ErrorView } from "@/components/entity-component"
import { useUpgradeModal } from "@/features/payments/hooks/use-upgrade-modal"
import { useWorkflowsParams } from "../hooks/use-workflows-params"
import { useEntitySearch } from "@/hooks/use-entity-search"
import { useRouter } from "next/navigation"
import { Workflow } from "@/lib/generated/prisma/client"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"

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

const WorkflowsStats = () => {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatsCard title="Prod. executions" value="0" subtext="Last 7 days" />
            <StatsCard title="Failed prod. executions" value="0" subtext="Last 7 days" />
            <StatsCard title="Failure rate" value="0" subtext="Last 7 days" />
            <StatsCard title="Time saved" value="0" subtext="Last 7 days" />
            <StatsCard title="Run time (avg.)" value="0" subtext="Last 7 days" />
        </div>
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
            <WorkflowsStats />
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
                <Button variant="outline" size="sm" className="h-9 gap-2 bg-background/50 border-input/50">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Sort by last updated</span>
                </Button>
                <div className="flex items-center gap-1 border border-input/50 rounded-md p-1 bg-background/50">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-sm">
                        <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Separator orientation="vertical" className="h-4" />
                    <Button variant="secondary" size="sm" className="h-7 w-7 p-0 rounded-sm shadow-none">
                        <ListIcon className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

const WorkflowsPagination = () => {
    const [params, setParams] = useWorkflowsParams()
    const workflows = useSuspenseWorkflows()
    return (
        <EntityPagination
            page={workflows.data.page}
            totalPages={workflows.data.totalPages}
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
