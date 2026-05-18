"use client"

import * as React from "react"
import { cn } from "@orchka/ui/utils"

type Tone = "default" | "primary" | "success" | "warning" | "danger" | "muted"

const toneClasses: Record<Tone, string> = {
  default: "border-border/70 bg-background text-foreground",
  primary: "border-primary/40 bg-primary/10 text-primary",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
  muted: "border-border/60 bg-muted/40 text-muted-foreground",
}

/* -------------------------------------------------------------------------- */
/*  Eyebrow                                                                   */
/* -------------------------------------------------------------------------- */

export function Eyebrow({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page Header                                                               */
/* -------------------------------------------------------------------------- */

interface SettingsHeaderProps {
  category?: string
  title: string
  description?: string
  meta?: Array<{ label: string; value: React.ReactNode; tone?: Tone }>
  action?: React.ReactNode
}

export function SettingsHeader({
  category = "Settings",
  title,
  description,
  meta,
  action,
}: SettingsHeaderProps) {
  return (
    <header className="border-b border-border/70 pb-8">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <Eyebrow>{`// ${category}`}</Eyebrow>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0 pt-1">{action}</div>}
      </div>

      {meta && meta.length > 0 && (
        <dl className="mt-7 grid grid-cols-2 divide-x divide-border/70 border border-border/70 bg-card/40 md:grid-cols-4">
          {meta.map((item, i) => (
            <div key={i} className="flex flex-col gap-1.5 px-4 py-3">
              <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {item.label}
              </dt>
              <dd
                className={cn(
                  "font-mono text-sm leading-tight",
                  item.tone === "primary" && "text-primary",
                  item.tone === "warning" && "text-amber-600 dark:text-amber-400",
                  item.tone === "danger" && "text-destructive",
                  item.tone === "success" && "text-emerald-500 dark:text-emerald-400",
                  !item.tone && "text-foreground",
                )}
              >
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/*  Section                                                                   */
/* -------------------------------------------------------------------------- */

interface SettingsSectionProps {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function SettingsSection({
  title,
  description,
  action,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        "relative grid grid-cols-1 gap-6 md:grid-cols-[14rem_1fr] md:gap-10",
        className,
      )}
    >
      <div className="md:sticky md:top-6 md:self-start">
        <div className="flex items-center gap-2.5">
          <span className="h-px w-6 bg-primary" aria-hidden />
          <h2 className="text-base font-semibold leading-snug text-foreground">
            {title}
          </h2>
        </div>
        {description && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>

      <div className="border border-border/70 bg-card">
        {children}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Section row                                                               */
/* -------------------------------------------------------------------------- */

interface RowProps {
  label: string
  hint?: string
  children: React.ReactNode
  align?: "start" | "center"
  className?: string
}

export function SettingsRow({
  label,
  hint,
  children,
  align = "center",
  className,
}: RowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border/70 px-5 py-4 last:border-b-0 md:flex-row md:gap-8 md:px-6 md:py-5",
        align === "start" ? "md:items-start" : "md:items-center",
        className,
      )}
    >
      <div className="flex-1 space-y-1">
        <div className="text-sm font-medium leading-tight text-foreground">
          {label}
        </div>
        {hint && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      <div className="md:w-[20rem] md:shrink-0">{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Status chip (sharp, themed)                                               */
/* -------------------------------------------------------------------------- */

interface StatusChipProps {
  tone?: Tone
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

export function StatusChip({
  tone = "default",
  children,
  className,
  icon,
}: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em]",
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Sticky save bar                                                           */
/* -------------------------------------------------------------------------- */

export function SettingsSaveBar({
  children,
  hint,
}: {
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="sticky bottom-6 z-10 flex items-center justify-between gap-4 border border-border/80 bg-card/95 px-5 py-3 shadow-lg backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="size-1.5 animate-pulse bg-primary" aria-hidden />
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {hint ?? "unsaved configuration"}
        </span>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
