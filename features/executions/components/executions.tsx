"use client"

import { Play, CheckCircle2, XCircle, Clock, Search, ListFilter, List as ListIcon, MoreVerticalIcon } from "lucide-react"
import Link from "next/link"

import { EntityList, EntityPagination, LoadingView, ErrorView } from "@/components/entity-component"
import { useExecutionsParams } from "../hooks/use-executions-params"
import { useEntitySearch } from "@/hooks/use-entity-search"
import { useSuspenseExecutions } from "../hooks/use-executions"
import { formatDistanceToNow } from "date-fns"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

const ExecutionsStats = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatsCard title="Total Executions" value="0" subtext="All time" />
      <StatsCard title="Successful" value="0" subtext="Last 7 days" />
      <StatsCard title="Failed" value="0" subtext="Last 7 days" />
      <StatsCard title="Success Rate" value="0%" subtext="Last 7 days" />
      <StatsCard title="Avg. Duration" value="0s" subtext="Last 7 days" />
    </div>
  )
}

const ExecutionsHeader = () => {
  return (
    <div className="flex flex-col gap-6 mb-8">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executions</h1>
          <p className="text-muted-foreground">Monitor and manage your workflow executions</p>
        </div>
      </div>
      <ExecutionsStats />
    </div>
  )
}

const ExecutionsToolbar = () => {
  const [params, setParams] = useExecutionsParams()
  const { searchValue, onSearchChange } = useEntitySearch({ params, setParams })

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search workflows..."
          className="pl-9 bg-muted/50 border-input/50 h-9"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-9 gap-2 bg-background/50 border-input/50">
          <ListFilter className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter by status</span>
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

const ExecutionsPagination = () => {
  const [params, setParams] = useExecutionsParams()
  const executions = useSuspenseExecutions()
  return (
    <EntityPagination
      page={executions.data.page}
      totalPages={executions.data.totalPages}
      onPageChange={(page) => setParams({ ...params, page })}
      disabled={executions.isFetching}
    />
  )
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge variant="secondary" className="gap-1 font-normal bg-green-500/10 text-green-600 hover:bg-green-500/20">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      )
    case "FAILED":
      return (
        <Badge variant="secondary" className="gap-1 font-normal bg-red-500/10 text-red-600 hover:bg-red-500/20">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      )
    case "RUNNING":
      return (
        <Badge variant="secondary" className="gap-1 font-normal bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
          <Play className="h-3 w-3 animate-pulse" />
          Running
        </Badge>
      )
    case "CANCELLED":
      return (
        <Badge variant="secondary" className="gap-1 font-normal bg-gray-500/10 text-gray-600 hover:bg-gray-500/20">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="gap-1 font-normal">
          {status}
        </Badge>
      )
  }
}

const ExecutionItem = ({ execution }: { execution: {
  id: string
  workflowId: string
  workflowName: string
  status: string
  startedAt: Date
  completedAt: Date | null
  error: string | null
} }) => {
  const duration = execution.completedAt
    ? formatDistanceToNow(new Date(execution.completedAt), { addSuffix: false })
    : formatDistanceToNow(new Date(execution.startedAt), { addSuffix: false })

  return (
    <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 hover:bg-muted/30 transition-all bg-card/40 border-l-4 border-l-transparent hover:border-l-primary/50">
      <div className="flex-1 min-w-0 space-y-1">
        <Link href={`/executions/${execution.id}`} className="block">
          <h3 className="text-sm font-semibold hover:text-primary transition-colors truncate">
            {execution.workflowName}
          </h3>
        </Link>
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Clock className="h-3 w-3" />
          <span>{duration}</span>
          <span className="hidden sm:inline text-muted-foreground/40">|</span>
          <span className="hidden sm:inline">Started {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
        {getStatusBadge(execution.status)}

        {execution.error && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xs text-red-500 max-w-[200px] truncate cursor-help">
                {execution.error}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-md">
              <p className="text-xs">{execution.error}</p>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/executions/${execution.id}`}>
                  <Play className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/workflows/${execution.workflowId}`}>
                  <Play className="mr-2 h-4 w-4" />
                  Open Workflow
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={execution.status === "COMPLETED" || execution.status === "FAILED"}
                className="text-destructive focus:text-destructive"
              >
                Cancel Execution
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export const ExecutionsList = () => {
  const executions = useSuspenseExecutions()

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <EntityList
          className="gap-px bg-border/40"
          items={executions.data.items}
          render={(execution) => (
            <ExecutionItem key={execution.id} execution={execution} />
          )}
          getKey={(execution) => execution.id}
          emptyView={<ExecutionsEmptyView />}
        />
      </div>
      {executions.data.items.length > 0 && <ExecutionsPagination />}
    </div>
  )
}

export const ExecutionsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full p-6 md:p-8 max-w-[1600px] mx-auto h-full bg-background text-foreground">
      <ExecutionsHeader />
      <ExecutionsToolbar />
      {children}
    </div>
  )
}

export const ExecutionsLoadingView = () => {
  return (
    <LoadingView entity="Executions" />
  )
}

export const ExecutionsEmptyView = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/50 rounded-lg bg-muted/5">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Play className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Executions Yet</h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        You haven&apos;t run any workflow executions yet. Start by running your first workflow.
      </p>
      <Button asChild>
        <Link href="/workflows">
          View Workflows
        </Link>
      </Button>
    </div>
  )
}

export const ExecutionsErrorView = () => {
  return (
    <ErrorView entity="Executions" />
  )
}
