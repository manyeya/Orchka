"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@orchka/ui/chart"

import { useSuspenseExecutionsSeries } from "../hooks/use-executions"

const chartConfig = {
  succeeded: {
    label: "Succeeded",
    color: "var(--primary)",
  },
  failed: {
    label: "Failed",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

function formatTick(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

function formatFullDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

export function ExecutionsChart() {
  const { data } = useSuspenseExecutionsSeries(30)
  const hasActivity = data.points.some((p) => p.succeeded > 0 || p.failed > 0)

  if (!hasActivity) {
    return (
      <div className="flex h-[180px] w-full flex-col items-center justify-center gap-1 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          no activity
        </span>
        <span className="text-xs text-muted-foreground/80">
          No executions in the last {data.windowDays} days. Run a workflow to see this chart populate.
        </span>
      </div>
    )
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[180px] w-full"
    >
      <BarChart data={data.points} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tickMargin={8}
          minTickGap={16}
          tickFormatter={formatTick}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={32}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => formatFullDate(value as string)}
              indicator="dot"
            />
          }
        />
        <Bar
          dataKey="succeeded"
          stackId="status"
          fill="var(--color-succeeded)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="failed"
          stackId="status"
          fill="var(--color-failed)"
          radius={[0, 0, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}

export function ExecutionsChartSkeleton() {
  return (
    <div className="h-[180px] w-full animate-pulse rounded-md bg-muted/40" />
  )
}
