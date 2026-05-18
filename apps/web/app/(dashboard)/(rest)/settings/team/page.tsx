import {
  Crown,
  MailPlus,
  MoreHorizontal,
  Shield,
  ShieldOff,
  UserCog,
  Users,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@orchka/ui/avatar"
import { Button } from "@orchka/ui/button"
import { Input } from "@orchka/ui/input"
import { Switch } from "@orchka/ui/switch"

import {
  Eyebrow,
  SettingsHeader,
  SettingsRow,
  SettingsSection,
  StatusChip,
} from "@/components/settings-shell"

const members = [
  {
    initials: "JD",
    name: "John Doe",
    email: "john@orchka.dev",
    role: "Owner",
    tone: "primary" as const,
    icon: Crown,
    lastActive: "online now",
  },
  {
    initials: "JS",
    name: "Jane Smith",
    email: "jane@orchka.dev",
    role: "Admin",
    tone: "default" as const,
    icon: Shield,
    lastActive: "12 min ago",
  },
  {
    initials: "MR",
    name: "Maria Reyes",
    email: "maria@orchka.dev",
    role: "Member",
    tone: "muted" as const,
    icon: UserCog,
    lastActive: "2 days ago",
  },
  {
    initials: "AK",
    name: "Aleksei Kowalski",
    email: "aleksei@contractor.io",
    role: "Guest",
    tone: "warning" as const,
    icon: ShieldOff,
    lastActive: "expires in 4 days",
  },
]

const invites = [
  { email: "dana@orchka.dev", role: "Admin", sentBy: "John Doe", sent: "1 hour ago" },
  { email: "ops@external.io", role: "Member", sentBy: "Jane Smith", sent: "yesterday" },
]

export default function TeamSettingsPage() {
  return (
    <div className="space-y-16">
      <SettingsHeader
        category="settings / team"
        title="Team"
        description="People with access to this workspace and the policies that govern them."
        meta={[
          { label: "members", value: "4 / 50" },
          { label: "pending invites", value: "2", tone: "warning" },
          { label: "guests", value: "1", tone: "warning" },
          { label: "sso", value: "google · github", tone: "success" },
        ]}
        action={
          <Button size="sm" className="gap-2 font-mono text-xs uppercase tracking-[0.18em]">
            <MailPlus className="size-3.5" />
            invite
          </Button>
        }
      />

      <SettingsSection
        title="Members"
        description="Active humans with at least one credential issued."
      >
        <div className="flex items-center gap-3 border-b border-border/70 bg-muted/30 px-5 py-3">
          <Users className="size-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter by name or email…"
            className="h-8 flex-1 border-0 bg-transparent font-mono text-xs shadow-none focus-visible:ring-0"
          />
          <Eyebrow>{members.length} total</Eyebrow>
        </div>

        <div className="divide-y divide-border/70">
          {members.map((m) => (
            <div
              key={m.email}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-5 px-6 py-4"
            >
              <Avatar className="size-9 rounded-none border border-border/70">
                <AvatarFallback className="rounded-none bg-muted font-mono text-xs">
                  {m.initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {m.email}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <StatusChip tone={m.tone} icon={<m.icon className="size-3" />}>
                  {m.role}
                </StatusChip>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {m.lastActive}
                </span>
              </div>

              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Pending Invites"
        description="Issued links awaiting acceptance. Expire after 7 days."
      >
        {invites.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Eyebrow>no pending invites</Eyebrow>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            <div className="grid grid-cols-[1.5fr_0.8fr_1fr_auto] gap-4 border-b border-border/70 bg-muted/30 px-6 py-3">
              <Eyebrow>email</Eyebrow>
              <Eyebrow>role</Eyebrow>
              <Eyebrow>sent</Eyebrow>
              <span />
            </div>
            {invites.map((inv) => (
              <div
                key={inv.email}
                className="grid grid-cols-[1.5fr_0.8fr_1fr_auto] items-center gap-4 px-6 py-4"
              >
                <span className="truncate font-mono text-xs text-foreground">
                  {inv.email}
                </span>
                <StatusChip tone="muted">{inv.role}</StatusChip>
                <div className="flex flex-col">
                  <span className="text-xs text-foreground">{inv.sent}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    by {inv.sentBy}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="font-mono text-xs uppercase tracking-[0.18em]">
                    resend
                  </Button>
                  <Button variant="ghost" size="sm" className="font-mono text-xs uppercase tracking-[0.18em] text-destructive hover:text-destructive">
                    revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Team Permissions"
        description="Default capabilities granted to non-admin members."
      >
        <SettingsRow
          label="Allow members to invite others"
          hint="Team members can send invitations to new collaborators."
        >
          <div className="flex items-center justify-between">
            <Eyebrow>members → invite</Eyebrow>
            <Switch defaultChecked />
          </div>
        </SettingsRow>
        <SettingsRow
          label="Require admin approval for new members"
          hint="New invitees must be approved before gaining workspace access."
        >
          <div className="flex items-center justify-between">
            <Eyebrow>admin gate</Eyebrow>
            <Switch />
          </div>
        </SettingsRow>
        <SettingsRow
          label="Auto-revoke inactive members"
          hint="Members with no activity for 90 days are downgraded to read-only."
        >
          <div className="flex items-center justify-between">
            <Eyebrow>90 day policy</Eyebrow>
            <Switch defaultChecked />
          </div>
        </SettingsRow>
        <SettingsRow
          label="Enforce 2FA"
          hint="Block sign-ins from accounts without a second factor enrolled."
        >
          <div className="flex items-center justify-between">
            <Eyebrow>security</Eyebrow>
            <Switch defaultChecked />
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  )
}
