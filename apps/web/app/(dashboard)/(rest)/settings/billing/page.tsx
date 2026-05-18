import {
  ArrowDownToLine,
  CreditCard,
  Plus,
  Receipt,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@orchka/ui/button"
import { Progress } from "@orchka/ui/progress"

import {
  Eyebrow,
  SettingsHeader,
  SettingsRow,
  SettingsSection,
  StatusChip,
} from "@/components/settings-shell"

const invoices = [
  { month: "April 2026", id: "INV-202604", amount: "$99.00", status: "paid" as const },
  { month: "March 2026", id: "INV-202603", amount: "$99.00", status: "paid" as const },
  { month: "February 2026", id: "INV-202602", amount: "$99.00", status: "paid" as const },
  { month: "January 2026", id: "INV-202601", amount: "$99.00", status: "paid" as const },
]

export default function BillingSettingsPage() {
  return (
    <div className="space-y-16">
      <SettingsHeader
        category="settings / billing"
        title="Billing"
        description="Subscription, payment instruments and invoice ledger."
        meta={[
          { label: "plan", value: "Enterprise", tone: "primary" },
          { label: "cadence", value: "monthly" },
          { label: "next charge", value: "Jun 18, 2026" },
          { label: "status", value: "active", tone: "success" },
        ]}
        action={
          <Button variant="outline" size="sm" className="gap-2 font-mono text-xs uppercase tracking-[0.18em]">
            <ArrowDownToLine className="size-3.5" />
            export csv
          </Button>
        }
      />

      <SettingsSection
        title="Current Plan"
        description="Subscription tier and contract metadata."
      >
        <div className="grid grid-cols-1 divide-y divide-border/70 md:grid-cols-[1.4fr_1fr] md:divide-x md:divide-y-0">
          <div className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <Eyebrow>tier</Eyebrow>
              <StatusChip tone="primary">enterprise</StatusChip>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-3xl font-semibold tracking-tight text-foreground">
                $99
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Renews automatically on the 18th of each month.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="font-mono text-xs uppercase tracking-[0.18em]">
                manage plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="font-mono text-xs uppercase tracking-[0.18em]"
              >
                cancel
              </Button>
            </div>
          </div>

          <dl className="grid grid-cols-1 divide-y divide-border/70 bg-muted/20">
            <Stat label="workflow executions" value="10,000" unit="/ month" />
            <Stat label="team seats" value="50" unit="included" />
            <Stat label="storage" value="∞" unit="unlimited" tone="primary" />
            <Stat label="SLA" value="99.95%" unit="uptime" />
          </dl>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Payment Method"
        description="Primary card billed on each cycle. Backup methods supported."
      >
        <div className="border-b border-border/70 px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-14 items-center justify-center border border-border/70 bg-foreground font-mono text-[10px] uppercase tracking-[0.18em] text-background">
                visa
              </div>
              <div>
                <p className="font-mono text-sm text-foreground">
                  •••• •••• •••• <span className="text-primary">4242</span>
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  expires 12 / 26 · billing@orchka.dev
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusChip tone="primary">primary</StatusChip>
              <Button variant="ghost" size="sm" className="font-mono text-xs uppercase tracking-[0.18em]">
                edit
              </Button>
            </div>
          </div>
        </div>
        <div className="px-6 py-4">
          <Button
            variant="outline"
            className="w-full justify-center gap-2 border-dashed font-mono text-xs uppercase tracking-[0.18em]"
          >
            <Plus className="size-3.5" />
            add payment method
          </Button>
        </div>
        <div className="flex items-center gap-2 border-t border-border/70 bg-muted/30 px-6 py-3 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-500 dark:text-emerald-400" />
          <span className="font-mono uppercase tracking-[0.18em]">
            PCI DSS · processed by Stripe · never stored locally
          </span>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Usage This Cycle"
        description="Resource consumption against your plan's quotas."
      >
        <UsageBar
          label="workflow executions"
          used={7250}
          total={10000}
          unit="runs"
          icon={<Receipt className="size-3.5" />}
        />
        <UsageBar
          label="storage"
          used={2.4}
          total={Infinity}
          unit="GB"
          tone="primary"
          icon={<CreditCard className="size-3.5" />}
        />
        <UsageBar
          label="active team seats"
          used={23}
          total={50}
          unit="seats"
          icon={<ShieldCheck className="size-3.5" />}
        />
      </SettingsSection>

      <SettingsSection
        title="Invoice Ledger"
        description="Most recent four billing periods. Older invoices available on request."
      >
        <div className="divide-y divide-border/70">
          <div className="grid grid-cols-[1.4fr_1fr_0.6fr_auto] gap-4 border-b border-border/70 bg-muted/30 px-6 py-3">
            <Eyebrow>period</Eyebrow>
            <Eyebrow>invoice</Eyebrow>
            <Eyebrow>amount</Eyebrow>
            <span />
          </div>
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="grid grid-cols-[1.4fr_1fr_0.6fr_auto] items-center gap-4 px-6 py-4"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{inv.month}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {inv.status}
                </span>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{inv.id}</span>
              <span className="font-mono text-sm tabular-nums text-foreground">{inv.amount}</span>
              <Button variant="ghost" size="sm" className="gap-2 font-mono text-xs uppercase tracking-[0.18em]">
                <ArrowDownToLine className="size-3.5" />
                pdf
              </Button>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  )
}

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string
  value: string
  unit: string
  tone?: "primary"
}) {
  return (
    <div className="flex items-baseline justify-between px-5 py-4">
      <Eyebrow>{label}</Eyebrow>
      <div className="flex items-baseline gap-1.5">
        <span
          className={
            "font-mono text-xl font-semibold tabular-nums " +
            (tone === "primary" ? "text-primary" : "text-foreground")
          }
        >
          {value}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {unit}
        </span>
      </div>
    </div>
  )
}

function UsageBar({
  label,
  used,
  total,
  unit,
  tone,
  icon,
}: {
  label: string
  used: number
  total: number
  unit: string
  tone?: "primary"
  icon?: React.ReactNode
}) {
  const isUnlimited = !Number.isFinite(total)
  const pct = isUnlimited ? 12 : Math.min(100, (used / total) * 100)
  const isWarning = !isUnlimited && pct >= 80
  const isDanger = !isUnlimited && pct >= 95

  return (
    <SettingsRow
      label={label}
      align="start"
      hint={
        isUnlimited
          ? "Unlimited on Enterprise plan."
          : `Resets at the end of the billing cycle.`
      }
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between font-mono text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="uppercase tracking-[0.18em]">used</span>
          </span>
          <span
            className={
              "tabular-nums " +
              (isDanger
                ? "text-destructive"
                : isWarning
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-foreground")
            }
          >
            {used.toLocaleString()} {unit}
            <span className="text-muted-foreground">
              {" "}
              / {isUnlimited ? "∞" : total.toLocaleString()}
            </span>
          </span>
        </div>
        <Progress
          value={pct}
          className={
            "h-1 rounded-none " +
            (tone === "primary"
              ? "bg-primary/15"
              : isDanger
                ? "bg-destructive/15 [&>[data-slot=progress-indicator]]:bg-destructive"
                : isWarning
                  ? "bg-amber-500/15 [&>[data-slot=progress-indicator]]:bg-amber-500"
                  : "bg-muted")
          }
        />
        <div className="flex items-center justify-between">
          <Eyebrow>{pct.toFixed(1)}%</Eyebrow>
          <Eyebrow>cycle 04 · 2026</Eyebrow>
        </div>
      </div>
    </SettingsRow>
  )
}
