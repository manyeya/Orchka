"use client"

import React, { useState, useMemo } from "react"
import { useSuspenseExecution } from "../hooks/use-executions"
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Copy,
  Terminal,
  Activity,
  Hash,
  Circle,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@orchka/ui/button"
import { Separator } from "@orchka/ui/separator"
import { format, formatDistanceToNowStrict, differenceInMilliseconds } from "date-fns"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@orchka/ui/resizable"
import { cn } from "@orchka/ui/utils"
import { scaleLinear } from "d3-scale"
import JsonView from "@uiw/react-json-view"
import { ScrollArea } from "@orchka/ui/scroll-area"
import {
  NODE_PALETTE_ROOT,
  flattenLeaves,
  type NodePaletteLeaf,
} from "@orchka/nodes/editor"
import Image from "next/image"

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

// --- Node icon resolution from palette registry ---

const NODE_ICON_MAP: Record<string, NodePaletteLeaf["icon"]> = (() => {
  const out: Record<string, NodePaletteLeaf["icon"]> = {}
  for (const leaf of flattenLeaves(NODE_PALETTE_ROOT)) {
    out[String(leaf.type)] = leaf.icon
  }
  return out
})()

const NodeGlyph = ({ nodeType, size = 14 }: { nodeType: string; size?: number }) => {
  const icon = NODE_ICON_MAP[nodeType]
  if (!icon) {
    return <Terminal style={{ width: size, height: size }} className="text-muted-foreground" />
  }
  if (typeof icon === "string") {
    return <Image src={icon} alt="" width={size} height={size} className="object-contain" />
  }
  const Icon = icon as LucideIcon
  return <Icon style={{ width: size, height: size }} />
}

// --- Status helpers ---

type StatusTone = "ok" | "fail" | "live" | "idle"

const statusOf = (status: string): StatusTone => {
  switch (status) {
    case "COMPLETED": return "ok"
    case "FAILED": return "fail"
    case "RUNNING": return "live"
    default: return "idle"
  }
}

const TONE_TEXT: Record<StatusTone, string> = {
  ok: "text-emerald-400",
  fail: "text-red-400",
  live: "text-sky-400",
  idle: "text-zinc-400",
}

const TONE_BG: Record<StatusTone, string> = {
  ok: "bg-emerald-500",
  fail: "bg-red-500",
  live: "bg-sky-400",
  idle: "bg-zinc-500",
}

const TONE_GLOW: Record<StatusTone, string> = {
  ok: "shadow-[0_0_24px_-6px_rgba(16,185,129,0.55)]",
  fail: "shadow-[0_0_24px_-6px_rgba(239,68,68,0.6)]",
  live: "shadow-[0_0_24px_-6px_rgba(56,189,248,0.65)]",
  idle: "shadow-none",
}

const TONE_BAR_FILL: Record<StatusTone, string> = {
  ok: "bg-emerald-500/85",
  fail: "bg-red-500/85",
  live: "bg-sky-400/85",
  idle: "bg-zinc-500/85",
}

const TONE_BAR_EDGE: Record<StatusTone, string> = {
  ok: "bg-emerald-300",
  fail: "bg-red-300",
  live: "bg-sky-200",
  idle: "bg-zinc-300",
}

const STATUS_LABEL: Record<StatusTone, string> = {
  ok: "OK",
  fail: "ERR",
  live: "RUN",
  idle: "—",
}

const StatusOrb = ({ tone, size = 8, animate }: { tone: StatusTone; size?: number; animate?: boolean }) => (
  <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
    {animate && tone === "live" && (
      <span className={cn("absolute inset-0 rounded-full opacity-60 animate-ping", TONE_BG[tone])} />
    )}
    <span
      className={cn("relative inline-flex rounded-full", TONE_BG[tone], TONE_GLOW[tone])}
      style={{ width: size, height: size }}
    />
  </span>
)

const StatusChip = ({ status }: { status: string }) => {
  const tone = statusOf(status)
  return (
    <span className={cn(
      "inline-flex items-center gap-2 rounded-sm border border-border/40 bg-background/40 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.18em]",
      TONE_TEXT[tone],
    )}>
      <StatusOrb tone={tone} animate />
      {STATUS_LABEL[tone]}
    </span>
  )
}

// --- Page-level header ---

const RunHeader = ({ execution }: { execution: any }) => {
  return (
    <div className="relative border-b border-border/40 bg-background/60 backdrop-blur-md">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-[420px] bg-gradient-to-bl from-primary/10 to-transparent blur-2xl" />
      </div>
      <div className="relative flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-border/50 bg-background/60 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <span>RUN</span>
              <span className="text-zinc-700">/</span>
              <span className="font-mono text-zinc-500 truncate">{execution.id}</span>
            </div>
            <h1 className="text-base font-semibold tracking-tight text-foreground truncate">
              {execution.workflowName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button size="sm" variant="ghost" asChild className="h-8 gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
            <Link href="/executions">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- Hero readouts ---

const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/** Hero-style single unit: { value: "1.4", unit: "h" }. Scales ms → s → m → h → d. */
const formatDuration = (ms: number | null): { value: string; unit: string } => {
  if (ms == null) return { value: "—", unit: "" }
  if (ms < SEC) return { value: ms.toString(), unit: "ms" }
  if (ms < MIN) return { value: (ms / SEC).toFixed(ms < 10 * SEC ? 2 : 1), unit: "s" }
  if (ms < HOUR) return { value: (ms / MIN).toFixed(1), unit: "m" }
  if (ms < DAY) return { value: (ms / HOUR).toFixed(1), unit: "h" }
  return { value: (ms / DAY).toFixed(1), unit: "d" }
}

/** Compact composite: "238ms", "1.23s", "2m 15s", "1h 23m", "3d 4h". */
const formatDurationCompact = (ms: number | null): string => {
  if (ms == null) return "—"
  if (ms < SEC) return `${ms}ms`
  if (ms < MIN) {
    const s = ms / SEC
    return s < 10 ? `${s.toFixed(2)}s` : `${s.toFixed(1)}s`
  }
  if (ms < HOUR) {
    const m = Math.floor(ms / MIN)
    const s = Math.floor((ms % MIN) / SEC)
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  if (ms < DAY) {
    const h = Math.floor(ms / HOUR)
    const m = Math.floor((ms % HOUR) / MIN)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  const d = Math.floor(ms / DAY)
  const h = Math.floor((ms % DAY) / HOUR)
  return h > 0 ? `${d}d ${h}h` : `${d}d`
}

const HeroReadout = ({
  label, value, unit, tone = "idle", icon: Icon, sub,
}: {
  label: string
  value: string
  unit?: string
  tone?: StatusTone
  icon?: LucideIcon
  sub?: string
}) => (
  <div className="relative flex flex-col gap-2 border-r border-border/30 px-6 py-5 last:border-r-0 overflow-hidden">
    <div className={cn("absolute top-0 left-0 h-px w-12", TONE_BG[tone])} />
    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
      <span>{label}</span>
      {Icon && <Icon className="h-3 w-3 opacity-50" />}
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className={cn("font-mono text-3xl font-medium leading-none tabular-nums", TONE_TEXT[tone])}>
        {value}
      </span>
      {unit && <span className="font-mono text-sm text-muted-foreground">{unit}</span>}
    </div>
    {sub && <div className="font-mono text-[10px] text-muted-foreground tracking-wide">{sub}</div>}
  </div>
)

const HeroStrip = ({ execution, steps }: { execution: any; steps: ExecutionStep[] }) => {
  const tone = statusOf(execution.status)
  const duration = execution.completedAt
    ? differenceInMilliseconds(new Date(execution.completedAt), new Date(execution.startedAt))
    : null
  const formattedDuration = formatDuration(duration)

  const okCount = steps.filter(s => s.status === "COMPLETED").length
  const failCount = steps.filter(s => s.status === "FAILED").length
  const startedRel = formatDistanceToNowStrict(new Date(execution.startedAt), { addSuffix: true })

  return (
    <div className="grid grid-cols-4 border-b border-border/40 bg-background/30">
      <HeroReadout
        label="Status"
        value={STATUS_LABEL[tone]}
        tone={tone}
        icon={tone === "ok" ? CheckCircle2 : tone === "fail" ? XCircle : tone === "live" ? Activity : Circle}
        sub={execution.completedAt
          ? `finished ${formatDistanceToNowStrict(new Date(execution.completedAt), { addSuffix: true })}`
          : "in progress"}
      />
      <HeroReadout
        label="Duration"
        value={formattedDuration.value}
        unit={formattedDuration.unit}
        icon={Clock}
        sub={`started ${startedRel}`}
      />
      <HeroReadout
        label="Steps"
        value={steps.length.toString().padStart(2, "0")}
        icon={Hash}
        sub={`${okCount} ok · ${failCount} err`}
        tone={failCount > 0 ? "fail" : steps.length > 0 ? "ok" : "idle"}
      />
      <HeroReadout
        label="Started"
        value={format(new Date(execution.startedAt), "HH:mm:ss")}
        sub={format(new Date(execution.startedAt), "MMM d, yyyy")}
      />
    </div>
  )
}

// --- Trace ---

const TraceTicks = ({ totalDuration }: { totalDuration: number }) => {
  const ticks = [0, 0.25, 0.5, 0.75, 1]
  return (
    <div className="sticky top-0 z-10 flex h-8 items-center border-b border-border/40 bg-background/80 px-6 backdrop-blur-md">
      <div className="w-[220px] shrink-0 font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        Node
      </div>
      <div className="relative flex-1 h-full">
        {ticks.map((t, i) => {
          const isFirst = i === 0
          const isLast = i === ticks.length - 1
          return (
            <div
              key={i}
              className="absolute top-0 h-full"
              style={{ left: `${t * 100}%` }}
            >
              <div className="absolute top-0 h-2 w-px bg-border/60" />
              <span
                className={cn(
                  "absolute top-3 whitespace-nowrap font-mono text-[9px] tabular-nums text-muted-foreground",
                  isFirst && "left-1.5",
                  isLast && "right-0",
                  !isFirst && !isLast && "left-1/2 -translate-x-1/2",
                )}
              >
                {formatDurationCompact(Math.round(totalDuration * t))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface PackedBar {
  start: number
  end: number
  duration: number
}

const TraceRow = ({
  step, index, isSelected, onClick, xScale, bar,
}: {
  step: ExecutionStep
  index: number
  isSelected: boolean
  onClick: () => void
  xScale: (t: number) => number
  bar: PackedBar
}) => {
  const tone = statusOf(step.status)
  const leftPct = xScale(bar.start)
  const widthPct = Math.max(xScale(bar.end) - leftPct, 0.6)

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex h-9 cursor-pointer items-center transition-colors",
        isSelected ? "bg-primary/5" : "hover:bg-zinc-900/40",
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-[2px] bg-primary transition-opacity",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="flex w-[220px] shrink-0 items-center gap-3 px-6">
        <span className="font-mono text-[10px] tabular-nums text-zinc-600">
          {String(index + 1).padStart(2, "0")}
        </span>
        <NodeGlyph nodeType={step.nodeType} size={14} />
        <span className="truncate text-[12px] font-medium tracking-tight text-foreground">
          {step.nodeName}
        </span>
      </div>

      <div className="relative flex-1 h-full pr-6">
        <div className="absolute inset-y-0 left-0 right-6 flex items-center">
          <div className="relative h-full w-full">
            <div
              className={cn(
                "absolute top-1/2 h-[18px] -translate-y-1/2 transition-all",
                TONE_BAR_FILL[tone],
                tone === "live" && "animate-pulse",
                "group-hover:brightness-110",
                isSelected && "shadow-[0_0_24px_-6px_var(--primary)]",
              )}
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            >
              <span className={cn("absolute inset-y-0 left-0 w-px", TONE_BAR_EDGE[tone])} />
              <span className={cn("absolute inset-y-0 right-0 w-px", TONE_BAR_EDGE[tone])} />
              {tone === "live" && (
                <span className="absolute inset-0 overflow-hidden">
                  <span className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent scan-x" />
                </span>
              )}
            </div>
            <span
              className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] tabular-nums text-muted-foreground"
              style={{ left: `calc(${leftPct + widthPct}% + 8px)` }}
            >
              {formatDurationCompact(bar.duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Step detail panel ---

const isEmptyPayload = (data: any) => {
  if (data == null) return true
  if (typeof data === "object" && Object.keys(data).length === 0) return true
  return false
}

const PayloadViewer = ({ data }: { data: any }) => {
  if (isEmptyPayload(data)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Circle className="mx-auto h-3 w-3 text-zinc-700 mb-3" />
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            empty payload
          </p>
        </div>
      </div>
    )
  }
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <JsonView
          value={data as object}
          style={{
            "--w-rjv-background-color": "transparent",
            "--w-rjv-color": "var(--foreground)",
            "--w-rjv-key-string": "var(--primary)",
            "--w-rjv-type-string-color": "oklch(0.78 0.13 160)",
            "--w-rjv-type-int-color": "oklch(0.78 0.12 220)",
            "--w-rjv-type-boolean-color": "oklch(0.78 0.13 320)",
            "--w-rjv-brackets-color": "var(--muted-foreground)",
            "--w-rjv-arrow-color": "var(--muted-foreground)",
            "--w-rjv-border-left": "1px solid var(--border)",
            "--w-rjv-line-color": "var(--border)",
            "--w-rjv-font-family": "var(--font-mono)",
            fontSize: "12px",
          } as React.CSSProperties}
          displayDataTypes={false}
          displayObjectSize
          shortenTextAfterLength={120}
          enableClipboard={false}
        />
      </div>
    </ScrollArea>
  )
}

const StepDetailPanel = ({
  step, activeTab, onTabChange,
}: {
  step: ExecutionStep | undefined
  activeTab: "input" | "output"
  onTabChange: (tab: "input" | "output") => void
}) => {
  if (!step) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            select a step
          </p>
          <p className="mt-1 text-xs text-zinc-600">Click any row in the trace to inspect its payload.</p>
        </div>
      </div>
    )
  }

  const stepDuration = step.completedAt
    ? differenceInMilliseconds(new Date(step.completedAt), new Date(step.startedAt))
    : null
  const formattedStepDur = formatDuration(stepDuration)
  const payload = activeTab === "input" ? step.input : (step.output ?? step.error)

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b border-border/40 bg-background/40 px-6 pt-5 pb-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border/40 bg-background/60 text-foreground/80">
              <NodeGlyph nodeType={step.nodeType} size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Step</div>
              <h3 className="text-sm font-semibold tracking-tight truncate">{step.nodeName}</h3>
            </div>
          </div>
          <StatusChip status={step.status} />
        </div>

        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-border/40 bg-border/40">
          <div className="bg-background/50 px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Node ID</div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-foreground" title={step.nodeId}>
              {step.nodeId}
            </div>
          </div>
          <div className="bg-background/50 px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Type</div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-foreground">
              {step.nodeType.toLowerCase()}
            </div>
          </div>
          <div className="bg-background/50 px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Duration</div>
            <div className="mt-0.5 font-mono text-[11px] tabular-nums text-foreground">
              {formattedStepDur.value}{formattedStepDur.unit}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/30 pt-3">
          <div className="flex items-center gap-1 rounded-sm border border-border/40 bg-background/30 p-0.5">
            {(["input", "output"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={cn(
                  "rounded-[3px] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors",
                  activeTab === tab
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
            onClick={() => navigator.clipboard.writeText(JSON.stringify(payload, null, 2))}
          >
            <Copy className="h-3 w-3" /> Copy
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-zinc-950/60">
        <PayloadViewer data={payload} />
      </div>
    </div>
  )
}

// --- Main view ---

export const ExecutionDetailView = ({ executionId }: { executionId: string }) => {
  const executionRes = useSuspenseExecution(executionId)
  const execution = executionRes.data
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"input" | "output">("input")

  const steps = (execution.steps || []) as ExecutionStep[]

  const selectedStep = useMemo(
    () => steps.find(s => s.id === selectedStepId) || steps[0],
    [selectedStepId, steps],
  )

  // Pack steps end-to-end on active execution time, ignoring inter-step queue gaps.
  // (Orchka executes branches sequentially per CLAUDE.md, so one step at a time.)
  const packedBars = useMemo<PackedBar[]>(() => {
    let cursor = 0
    return steps.map((step) => {
      const start = new Date(step.startedAt).getTime()
      const end = step.completedAt ? new Date(step.completedAt).getTime() : Date.now()
      const duration = Math.max(end - start, 0)
      const bar = { start: cursor, end: cursor + duration, duration }
      cursor += duration
      return bar
    })
  }, [steps])

  const totalDuration = Math.max(
    packedBars.length > 0 ? packedBars[packedBars.length - 1].end : 0,
    1,
  )

  const xScale = useMemo(() => {
    const scale = scaleLinear().domain([0, totalDuration]).range([0, 100])
    return (t: number) => scale(t)
  }, [totalDuration])

  if (steps.length === 0 && execution.status === "RUNNING") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-background">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border border-sky-400/30 animate-ping absolute inset-0" />
          <div className="h-12 w-12 rounded-full border-2 border-sky-400/60 flex items-center justify-center relative">
            <Activity className="h-5 w-5 text-sky-400" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sky-400">awaiting telemetry</p>
          <p className="text-xs text-muted-foreground">Workflow is starting — first step pending.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col bg-background selection:bg-primary/20">
      <div className="relative flex flex-col h-full">
        <RunHeader execution={execution} />
        <HeroStrip execution={execution} steps={steps} />

        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={56} minSize={32} className="flex flex-col border-r border-border/40">
              <div className="flex items-center justify-between border-b border-border/40 bg-background/30 px-6 py-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Execution Trace
                  </span>
                </div>
                <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                  {formatDurationCompact(totalDuration)} active
                </span>
              </div>

              {steps.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="text-center">
                    <Circle className="mx-auto h-3 w-3 text-zinc-700 mb-3" />
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      no steps recorded
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative flex-1 overflow-y-auto custom-scrollbar">
                  <TraceTicks totalDuration={totalDuration} />
                  <div className="relative">
                    {steps.map((step, i) => (
                      <TraceRow
                        key={step.id}
                        step={step}
                        index={i}
                        isSelected={selectedStep?.id === step.id}
                        onClick={() => setSelectedStepId(step.id)}
                        xScale={xScale}
                        bar={packedBars[i]}
                      />
                    ))}
                  </div>
                </div>
              )}
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={44} minSize={28} className="flex flex-col bg-background/40">
              <StepDetailPanel
                step={selectedStep}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
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
        @keyframes scan-x {
          0% { transform: translateX(0%); }
          100% { transform: translateX(400%); }
        }
        .scan-x {
          animation: scan-x 1.6s linear infinite;
        }
      `}</style>
    </div>
  )
}

export const ExecutionLoadingView = () => (
  <div className="flex h-full w-full items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <RefreshCw className="h-6 w-6 animate-spin text-primary opacity-50" />
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        loading execution
      </p>
    </div>
  </div>
)

export const ExecutionErrorView = () => (
  <div className="flex h-full w-full items-center justify-center bg-background p-8">
    <div className="w-full max-w-md space-y-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-sm border border-red-500/30 bg-red-500/10">
        <AlertCircle className="h-6 w-6 text-red-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Failed to load execution</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          There was an error retrieving the execution data. It might have been deleted or is currently unavailable.
        </p>
      </div>
      <Button variant="outline" className="w-full font-mono text-[11px] uppercase tracking-[0.16em]" asChild>
        <Link href="/executions" className="flex items-center justify-center gap-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to executions
        </Link>
      </Button>
    </div>
  </div>
)
