"use client"

import {
  Bell,
  Globe2,
  KeyRound,
  MoonStar,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react"
import { Button } from "@orchka/ui/button"
import { Input } from "@orchka/ui/input"
import { Switch } from "@orchka/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@orchka/ui/select"
import { Textarea } from "@orchka/ui/textarea"

import {
  SettingsHeader,
  SettingsRow,
  SettingsSaveBar,
  SettingsSection,
  StatusChip,
} from "@/components/settings-shell"

export function GeneralSettingsForm() {
  return (
    <div className="space-y-16">
      <SettingsHeader
        category="settings / general"
        title="General"
        description="Workspace identity, locale and notification policy for the Orchka control plane."
        meta={[
          { label: "workspace", value: "project-orc" },
          { label: "region", value: "us-east-1" },
          { label: "plan", value: "Enterprise", tone: "primary" },
          { label: "last sync", value: "2m ago", tone: "success" },
        ]}
        action={
          <StatusChip tone="success">
            <span className="size-1.5 animate-pulse bg-current" aria-hidden />
            healthy
          </StatusChip>
        }
      />

      <SettingsSection
        title="Workspace Identity"
        description="How this workspace surfaces to your team and integrations."
      >
        <SettingsRow label="Application name" hint="Displayed in the sidebar and emails.">
          <Input defaultValue="Flowbase" className="font-mono" />
        </SettingsRow>
        <SettingsRow label="Workspace slug" hint="Used in workflow URLs. Lowercase, hyphenated.">
          <div className="flex items-center border border-input bg-transparent">
            <span className="border-r border-input px-3 py-2 font-mono text-xs text-muted-foreground">
              orchka.app/
            </span>
            <Input
              defaultValue="project-orc"
              className="h-9 border-0 font-mono shadow-none focus-visible:ring-0"
            />
          </div>
        </SettingsRow>
        <SettingsRow label="Description" hint="Optional. Visible to teammates only." align="start">
          <Textarea
            placeholder="Internal automation infrastructure…"
            className="min-h-[88px] font-mono text-xs"
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="Locale & Timing"
        description="Regional defaults applied to all new workflows."
      >
        <SettingsRow label="Default language">
          <Select defaultValue="en">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English (US)</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Timezone" hint="Used when scheduling cron triggers.">
          <Select defaultValue="utc">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="utc">UTC · Coordinated Universal Time</SelectItem>
              <SelectItem value="est">EST · America/New_York</SelectItem>
              <SelectItem value="cet">CET · Europe/Berlin</SelectItem>
              <SelectItem value="jst">JST · Asia/Tokyo</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Appearance" hint="Light follows system unless overridden.">
          <div className="flex items-center gap-3 border border-input px-3 py-2">
            <MoonStar className="size-4 text-muted-foreground" />
            <span className="text-sm">System default</span>
            <Switch className="ml-auto" defaultChecked />
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="Notifications"
        description="Delivery channels for execution alerts, billing events and team activity."
      >
        <SettingsRow
          label="Email notifications"
          hint="Workflow failures, weekly digest, billing receipts."
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Bell className="size-3.5" />
              <span className="font-mono uppercase tracking-[0.18em]">enabled</span>
            </div>
            <Switch defaultChecked />
          </div>
        </SettingsRow>
        <SettingsRow label="Browser push" hint="Real-time alerts while the dashboard is open.">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe2 className="size-3.5" />
              <span className="font-mono uppercase tracking-[0.18em]">off</span>
            </div>
            <Switch />
          </div>
        </SettingsRow>
        <SettingsRow label="Slack workspace" hint="Pipe execution events to a channel.">
          <Button variant="outline" className="w-full justify-between gap-2 font-mono text-xs">
            <span className="uppercase tracking-[0.18em]">connect slack</span>
            <KeyRound className="size-3.5" />
          </Button>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="Danger Zone"
        description="Irreversible operations. Require admin confirmation."
      >
        <SettingsRow
          label="Reset workspace defaults"
          hint="Restore all settings on this page to factory values."
        >
          <Button variant="outline" className="w-full gap-2">
            <RefreshCcw className="size-3.5" />
            Reset to defaults
          </Button>
        </SettingsRow>
        <SettingsRow
          label="Delete workspace"
          hint="Permanently destroys all workflows, executions and credentials."
        >
          <Button variant="destructive" className="w-full gap-2">
            <Trash2 className="size-3.5" />
            Delete workspace…
          </Button>
        </SettingsRow>
      </SettingsSection>

      <SettingsSaveBar hint="3 changes pending · auto-save off">
        <Button variant="ghost" size="sm" className="font-mono text-xs uppercase tracking-[0.18em]">
          discard
        </Button>
        <Button size="sm" className="gap-2 font-mono text-xs uppercase tracking-[0.18em]">
          <Save className="size-3.5" />
          commit
        </Button>
      </SettingsSaveBar>

    </div>
  )
}
