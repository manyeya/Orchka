import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Info,
  RotateCcw,
} from "lucide-react"
import { Button } from "@orchka/ui/button"
import { Progress } from "@orchka/ui/progress"

import {
  Eyebrow,
  SettingsHeader,
  SettingsSection,
  StatusChip,
} from "@/components/settings-shell"

const rateLimits = [
  {
    label: "Requests per minute",
    used: 850,
    total: 1000,
    resets: "12 minutes",
    icon: Gauge,
  },
  {
    label: "Requests per hour",
    used: 45200,
    total: 50000,
    resets: "2h 15m",
    icon: Activity,
  },
  {
    label: "Requests per day",
    used: 980000,
    total: 1000000,
    resets: "18 hours",
    icon: Cpu,
  },
]

const alerts = [
  {
    tone: "warning" as const,
    title: "Hourly limit approaching",
    body: "90% of hourly API requests used. Consider batching cron triggers.",
    when: "2 hours ago",
    icon: AlertTriangle,
  },
  {
    tone: "default" as const,
    title: "Daily limit reset",
    body: "Your daily API limits have been reset. New ceiling: 1,000,000.",
    when: "yesterday",
    icon: Info,
  },
  {
    tone: "primary" as const,
    title: "Concurrency raised",
    body: "Per-workspace concurrency increased from 15 → 20 for Enterprise.",
    when: "3 days ago",
    icon: ArrowUpRight,
  },
]

export default function LimitsSettingsPage() {
  return (
    <div className="space-y-16">
      <SettingsHeader
        category="settings / limits"
        title="Limits"
        description="Plan ceilings, rate windows and resource quotas. Telemetry refreshes every 60 seconds."
        meta={[
          { label: "plan", value: "Enterprise", tone: "primary" },
          { label: "peak rpm", value: "850", tone: "warning" },
          { label: "concurrency", value: "8 / 20" },
          { label: "next reset", value: "12 min", tone: "success" },
        ]}
        action={
          <Button
            variant="outline"
            size="sm"
            className="gap-2 font-mono text-xs uppercase tracking-[0.18em]"
          >
            <RotateCcw className="size-3.5" />
            refresh
          </Button>
        }
      />

      <SettingsSection
        title="API Rate Limits"
        description="Sliding windows enforced per workspace. Bursts above the soft ceiling are queued."
      >
        <div className="divide-y divide-border/70">
          {rateLimits.map((r) => {
            const pct = (r.used / r.total) * 100
            const isWarn = pct >= 80
            const isDanger = pct >= 95
            return (
              <div key={r.label} className="grid gap-4 px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <r.icon className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{r.label}</span>
                  </div>
                  <span
                    className={
                      "font-mono text-xs tabular-nums " +
                      (isDanger
                        ? "text-destructive"
                        : isWarn
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-foreground")
                    }
                  >
                    {r.used.toLocaleString()}
                    <span className="text-muted-foreground"> / {r.total.toLocaleString()}</span>
                  </span>
                </div>
                <Progress
                  value={pct}
                  className={
                    "h-1 rounded-none " +
                    (isDanger
                      ? "bg-destructive/15 [&>[data-slot=progress-indicator]]:bg-destructive"
                      : isWarn
                        ? "bg-amber-500/15 [&>[data-slot=progress-indicator]]:bg-amber-500"
                        : "bg-muted [&>[data-slot=progress-indicator]]:bg-primary")
                  }
                />
                <div className="flex items-center justify-between">
                  <Eyebrow>{pct.toFixed(1)}% consumed</Eyebrow>
                  <Eyebrow>resets in {r.resets}</Eyebrow>
                </div>
              </div>
            )
          })}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Resource Quotas"
        description="Fixed ceilings for workflow surface area and storage."
      >
        <div className="grid grid-cols-1 divide-y divide-border/70 md:grid-cols-2 md:divide-x md:divide-y-0">
          <QuotaGroup
            title="Workflows"
            icon={<Cpu className="size-3.5" />}
            items={[
              { label: "Active workflows", value: "23", limit: "50" },
              { label: "Workflow steps", value: "156", limit: "500" },
              { label: "Concurrent executions", value: "8", limit: "20" },
              { label: "Scheduled triggers", value: "12", limit: "100" },
            ]}
          />
          <QuotaGroup
            title="Storage"
            icon={<HardDrive className="size-3.5" />}
            items={[
              { label: "File storage", value: "2.4 GB", limit: "10 GB" },
              { label: "Database records", value: "45,231", limit: "100,000" },
              { label: "Log retention", value: "30 days", limit: "—" },
              { label: "Audit retention", value: "1 year", limit: "—" },
            ]}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Recent Alerts"
        description="Limit-related events from the past 30 days."
      >
        <div className="divide-y divide-border/70">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-start gap-4 px-6 py-4">
              <div
                className={
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center border " +
                  (a.tone === "warning"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : a.tone === "primary"
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/70 bg-muted text-muted-foreground")
                }
              >
                <a.icon className="size-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.body}</p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {a.when}
              </span>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Upgrade Path"
        description="Higher tiers raise rate windows and concurrency. Pricing in USD, billed monthly."
      >
        <div className="grid grid-cols-1 divide-y divide-border/70 md:grid-cols-3 md:divide-x md:divide-y-0">
          <PlanCard
            name="Pro"
            price="$29"
            features={["5,000 rpm", "25 active workflows", "5 GB storage"]}
            cta="Downgrade"
            variant="outline"
          />
          <PlanCard
            name="Business"
            price="$79"
            features={["25,000 rpm", "100 active workflows", "50 GB storage"]}
            cta="Downgrade"
            variant="outline"
          />
          <PlanCard
            name="Enterprise"
            price="$99"
            features={["50,000 rpm", "Unlimited workflows", "Unlimited storage"]}
            cta="Current plan"
            variant="ghost"
            current
          />
        </div>
      </SettingsSection>
    </div>
  )
}

function QuotaGroup({
  title,
  icon,
  items,
}: {
  title: string
  icon: React.ReactNode
  items: Array<{ label: string; value: string; limit: string }>
}) {
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <Eyebrow>{title}</Eyebrow>
      </div>
      <dl className="divide-y divide-border/70 border-t border-border/70">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between py-3">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="font-mono text-xs tabular-nums">
              <span className="text-foreground">{item.value}</span>
              <span className="text-muted-foreground"> / {item.limit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function PlanCard({
  name,
  price,
  features,
  cta,
  variant,
  current,
}: {
  name: string
  price: string
  features: string[]
  cta: string
  variant: "outline" | "ghost"
  current?: boolean
}) {
  return (
    <div className={"flex flex-col gap-4 p-6 " + (current ? "bg-primary/5" : "")}>
      <div className="flex items-center justify-between">
        <Eyebrow>{name}</Eyebrow>
        {current && <StatusChip tone="primary">current</StatusChip>}
      </div>
      <p className="font-mono text-2xl font-semibold tracking-tight text-foreground">
        {price}
        <span className="text-sm font-normal text-muted-foreground">/mo</span>
      </p>
      <ul className="space-y-2 text-xs text-muted-foreground">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="size-1 bg-primary" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <Button
        variant={variant}
        size="sm"
        className="mt-auto w-full font-mono text-xs uppercase tracking-[0.18em]"
        disabled={current}
      >
        {cta}
      </Button>
    </div>
  )
}
