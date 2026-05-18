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
  const { data } = useSuspenseExecutionsSeries(7)

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
