"use client"

import React, { useState, useMemo } from "react"
import { useSuspenseExecution } from "../hooks/use-executions"
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Search,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  Plus,
  Copy,
  LayoutGrid,
  Maximize2,
  Terminal
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow, format, differenceInMilliseconds } from "date-fns"
import { LoadingView } from "@/components/entity-component"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { cn } from "@/lib/utils"
import { scaleLinear } from "d3-scale"
import JsonView from "@uiw/react-json-view"
import { ScrollArea } from "@/components/ui/scroll-area"

// --- Types ---

interface ExecutionStep {
  id: string
  nodeId: string
  nodeName: string
  nodeType: string
  status: string
  startedAt: Date
  completedAt: Date | null
  input: any
  output: any
  error: string | null
}

// --- Components ---

const StatusBadge = ({ status, className }: { status: string, className?: string }) => {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge variant="secondary" className={cn("gap-1.5 font-medium bg-emerald-500/10 text-emerald-500 border-emerald-500/20", className)}>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Completed
        </Badge>
      )
    case "FAILED":
      return (
        <Badge variant="secondary" className={cn("gap-1.5 font-medium bg-red-500/10 text-red-500 border-red-500/20", className)}>
          <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Failed
        </Badge>
      )
    case "RUNNING":
      return (
        <Badge variant="secondary" className={cn("gap-1.5 font-medium bg-blue-500/10 text-blue-500 border-blue-500/20", className)}>
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          Running
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className={cn("gap-1.5 font-medium border-border/50", className)}>
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          {status}
        </Badge>
      )
  }
}

const ExecutionHeader = ({ workflowName }: { workflowName: string }) => {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold tracking-tight">Run Details</h1>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-sm text-muted-foreground truncate max-w-[300px]">{workflowName}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" asChild className="h-8 gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/executions">
            <ArrowLeft className="h-4 w-4" />
            Back to All
          </Link>
        </Button>
      </div>
    </div>
  )
}

const RunInfoGrid = ({ execution }: { execution: any }) => {
  return (
    <div className="grid grid-cols-4 items-center px-6 py-4 bg-background/20 transition-colors border-b border-border/40 text-[12px]">
      <div className="space-y-1">
        <div className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mb-2">Status</div>
        <StatusBadge status={execution.status} />
      </div>
      <div className="space-y-1">
        <div className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mb-2">Execution ID</div>
        <div className="font-mono text-foreground truncate pr-4">{execution.id}</div>
      </div>
      <div className="space-y-1 text-muted-foreground">
        <div className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mb-2">Started at</div>
        <div>{format(new Date(execution.startedAt), 'PPP p')}</div>
      </div>
      <div className="space-y-1 text-muted-foreground">
        <div className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mb-2">Ended at</div>
        <div>{execution.completedAt ? format(new Date(execution.completedAt), 'PPP p') : 'Still running...'}</div>
      </div>
    </div>
  )
}

const TraceItem = ({ step, isSelected, onClick, xScale }: { step: ExecutionStep, isSelected: boolean, onClick: () => void, xScale: any }) => {
  const stepStart = new Date(step.startedAt).getTime();
  const stepEnd = step.completedAt ? new Date(step.completedAt).getTime() : Date.now();
  const duration = stepEnd - stepStart;

  const leftOffset = xScale(stepStart);
  const widthPercentage = Math.max(xScale(stepEnd) - leftOffset, 1.5);

  return (
    <div
      className={cn(
        "group flex items-center py-1.5 cursor-pointer transition-colors relative",
        isSelected ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/30 border-l-2 border-transparent"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 w-56 shrink-0 px-4">
        <Badge variant="outline" className="h-5 px-1.5 font-normal text-[10px] border-border/40 text-muted-foreground bg-muted/20">
          {step.nodeType.split('_').pop()?.toLowerCase() || 'node'}
        </Badge>
        <div className="flex items-center gap-2 truncate">
          <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Terminal className="h-3 w-3 text-primary" />
          </div>
          <span className="text-[12px] font-medium truncate text-foreground">{step.nodeName}</span>
        </div>
      </div>

      <div className="flex-1 h-8 flex items-center pr-4 relative">
        <div className="absolute inset-x-0 inset-y-1/2 flex items-center h-px bg-border/10" />
        <div
          className={cn(
            "h-5 rounded-sm relative z-10 transition-all shadow-sm border border-black/10",
            step.status === 'COMPLETED' ? "bg-emerald-500/80 group-hover:bg-emerald-500" :
              step.status === 'FAILED' ? "bg-red-500/80 group-hover:bg-red-500" :
                "bg-blue-500/80 group-hover:bg-blue-500 animate-pulse"
          )}
          style={{ width: `${widthPercentage}%`, marginLeft: `${leftOffset}%` }}
        />
        <span className="ml-2 text-[10px] text-muted-foreground absolute left-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {duration}ms
        </span>
      </div>
    </div>
  )
}

const PayloadViewer = ({ label, data }: { label: string, data: any }) => {
  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <Badge variant="secondary" className="bg-muted border-none text-muted-foreground h-7 px-3 text-[11px] font-medium uppercase tracking-wider">
          {label}
        </Badge>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1.5" onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}>
            <Copy className="h-3 w-3" /> Copy
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 rounded-md border border-border/40 bg-zinc-950/80 overflow-hidden shadow-inner flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-4">
            <JsonView
              value={data as object}
              style={{
                "--w-rjv-background-color": "transparent",
                "--w-rjv-color": "var(--foreground)",
                "--w-rjv-key-string": "var(--primary)",
                "--w-rjv-type-string-color": "oklch(0.75 0.12 160)",
                "--w-rjv-type-int-color": "oklch(0.75 0.12 260)",
                "--w-rjv-type-boolean-color": "oklch(0.75 0.12 300)",
                "--w-rjv-brackets-color": "var(--muted-foreground)",
                "--w-rjv-arrow-color": "var(--muted-foreground)",
                "--w-rjv-border-left": "1px solid var(--border)",
                "--w-rjv-line-color": "var(--border)",
                "--w-rjv-font-family": "var(--font-mono)",
                fontSize: "13px",
              } as React.CSSProperties}
              displayDataTypes={false}
              displayObjectSize={true}
              shortenTextAfterLength={100}
              enableClipboard={false} // We have our own copy button
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

// --- Main View ---

export const ExecutionDetailView = ({ executionId }: { executionId: string }) => {
  const executionRes = useSuspenseExecution(executionId)
  const execution = executionRes.data
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input')

  const steps = (execution.steps || []) as ExecutionStep[]

  const selectedStep = useMemo(() =>
    steps.find(s => s.id === selectedStepId) || steps[0],
    [selectedStepId, steps])

  const timelineStart = useMemo(() =>
    steps.length > 0 ? new Date(steps[0].startedAt).getTime() : new Date(execution.startedAt).getTime(),
    [steps, execution.startedAt])

  const timelineEnd = useMemo(() => {
    if (steps.length === 0) return new Date(execution.completedAt || Date.now()).getTime()
    const lastStep = steps[steps.length - 1]
    return lastStep.completedAt ? new Date(lastStep.completedAt).getTime() : Date.now()
  }, [steps, execution.completedAt])

  const totalDuration = Math.max(timelineEnd - timelineStart, 1)

  const xScale = useMemo(() => {
    return scaleLinear()
      .domain([timelineStart, timelineEnd])
      .range([0, 100])
  }, [timelineStart, timelineEnd])

  if (steps.length === 0 && execution.status === 'RUNNING') {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-background gap-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin opacity-50" />
        <div className="text-center">
          <p className="text-sm font-semibold">Workflow is starting...</p>
          <p className="text-xs text-muted-foreground">Waiting for the first step to be recorded.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background selection:bg-primary/20">
      <ExecutionHeader workflowName={execution.workflowName} />
      <RunInfoGrid execution={execution} />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col border-r border-border/40">
            {/* Trace Header */}
            <div className="px-6 py-4 flex flex-col gap-4 border-b border-border/40 bg-zinc-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold tracking-tight uppercase text-muted-foreground">Execution Trace</span>
                </div>
              </div>

              {steps.length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-border/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">No step details recorded for this execution.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[11px]">
                <div className="space-y-1">
                  <div className="text-muted-foreground font-medium">Steps count</div>
                  <div className="text-foreground font-bold">{steps.length}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground font-medium">Total Duration</div>
                  <div className="text-foreground font-bold">
                    {execution.completedAt ? differenceInMilliseconds(new Date(execution.completedAt), new Date(execution.startedAt)) : "-"}ms
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline View */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-background/20">
              <div className="sticky top-0 h-8 border-b border-border/40 bg-background/80 backdrop-blur-md z-10 flex text-[10px] font-mono text-muted-foreground px-4 items-center">
                <div className="w-56 shrink-0 font-bold uppercase tracking-widest text-[9px]">Node Name</div>
                <div className="flex-1 flex justify-between items-center relative pr-4">
                  <span>0ms</span>
                  <Separator orientation="vertical" className="h-2 opacity-20" />
                  <span>{Math.round(totalDuration / 2)}ms</span>
                  <Separator orientation="vertical" className="h-2 opacity-20" />
                  <span>{totalDuration}ms</span>
                </div>
              </div>
              <div className="py-2">
                {steps.map((step) => (
                  <TraceItem
                    key={step.id}
                    step={step}
                    isSelected={selectedStepId === step.id}
                    onClick={() => setSelectedStepId(step.id)}
                    xScale={xScale}
                  />
                ))}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col bg-background/40">
            {/* Payload Header */}
            <div className="px-6 py-4 flex flex-col gap-4 border-b border-border/40 bg-zinc-900/10 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold tracking-tight uppercase text-muted-foreground">Step Details</span>
                </div>
              </div>

              {selectedStep ? (
                <>
                  <div className="grid grid-cols-2 gap-4 text-[11px]">
                    <div className="space-y-1">
                      <div className="text-muted-foreground font-medium">Node ID</div>
                      <div className="font-semibold text-foreground truncate">{selectedStep.nodeId}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground font-medium">Status</div>
                      <StatusBadge status={selectedStep.status} className="scale-90 origin-left" />
                    </div>
                  </div>

                  <div className="pt-4 mt-auto">
                    <div className="flex items-center gap-6">
                      <button
                        className={cn(
                          "text-[12px] font-bold pb-2 border-b-2 transition-all px-1",
                          activeTab === 'input' ? "text-foreground border-foreground" : "text-muted-foreground border-transparent hover:text-foreground"
                        )}
                        onClick={() => setActiveTab('input')}
                      >
                        Input
                      </button>
                      <button
                        className={cn(
                          "text-[12px] font-bold pb-2 border-b-2 transition-all px-1",
                          activeTab === 'output' ? "text-foreground border-foreground" : "text-muted-foreground border-transparent hover:text-foreground"
                        )}
                        onClick={() => setActiveTab('output')}
                      >
                        Output
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">Select a step to view details</p>
                </div>
              )}
            </div>

            {/* Payload Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-zinc-900/5">
              {selectedStep && (
                activeTab === 'input' ? (
                  <PayloadViewer label="Input Payload" data={selectedStep.input} />
                ) : (
                  <PayloadViewer label="Output Result" data={selectedStep.output || selectedStep.error} />
                )
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--border) / 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--border) / 0.7);
        }
      `}</style>
    </div>
  )
}

export const ExecutionLoadingView = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin opacity-50" />
        <p className="text-sm font-medium text-muted-foreground tracking-wide">Fetching execution history...</p>
      </div>
    </div>
  )
}

export const ExecutionErrorView = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-background p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Failed to load execution</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            There was an error retrieving the execution data. It might have been deleted or is currently unavailable.
          </p>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/executions" className="flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to All Executions
          </Link>
        </Button>
      </div>
    </div>
  )
}
