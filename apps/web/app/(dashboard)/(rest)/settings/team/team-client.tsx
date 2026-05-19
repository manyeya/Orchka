"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Building2,
  Crown,
  Loader2,
  MailPlus,
  MoreHorizontal,
  Save,
  Shield,
  Trash2,
  UserCog,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@orchka/ui/avatar"
import { Button } from "@orchka/ui/button"
import { Input } from "@orchka/ui/input"
import { Label } from "@orchka/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@orchka/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@orchka/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@orchka/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@orchka/ui/alert-dialog"

import {
  authClient,
  useActiveOrganization,
  useSession,
} from "@/features/auth/client"
import {
  Eyebrow,
  SettingsHeader,
  SettingsRow,
  SettingsSaveBar,
  SettingsSection,
  StatusChip,
} from "@/components/settings-shell"

type Role = "owner" | "admin" | "member"

type FullOrgMember = {
  id: string
  role: string
  createdAt: Date | string
  userId: string
  user: { id: string; name: string; email: string; image?: string | null }
}

type FullOrgInvitation = {
  id: string
  email: string
  role: string | null
  status: string
  expiresAt: Date | string
}

type FullOrg = {
  id: string
  name: string
  slug: string
  logo?: string | null
  members: FullOrgMember[]
  invitations: FullOrgInvitation[]
}

function initialsOf(name: string, fallback: string) {
  const source = (name || fallback).trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

function roleTone(role: string): { tone: "primary" | "default" | "muted" | "warning"; Icon: React.ComponentType<{ className?: string }> } {
  switch (role) {
    case "owner":
      return { tone: "primary", Icon: Crown }
    case "admin":
      return { tone: "default", Icon: Shield }
    case "member":
      return { tone: "muted", Icon: UserCog }
    default:
      return { tone: "warning", Icon: UserCog }
  }
}

export function TeamSettingsClient() {
  const router = useRouter()
  const { data: session } = useSession()
  const { data: activeOrg } = useActiveOrganization()

  const [fullOrg, setFullOrg] = React.useState<FullOrg | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  const refresh = React.useCallback(async () => {
    if (!activeOrg?.id) return
    setRefreshing(true)
    try {
      const result = await authClient.organization.getFullOrganization({
        query: { organizationId: activeOrg.id },
      })
      if (result.data) setFullOrg(result.data as unknown as FullOrg)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [activeOrg?.id])

  React.useEffect(() => {
    if (!activeOrg?.id) {
      setLoading(false)
      return
    }
    refresh()
  }, [activeOrg?.id, refresh])

  const currentUserId = session?.user?.id
  const currentMember = fullOrg?.members.find((m) => m.userId === currentUserId)
  const isOwner = currentMember?.role === "owner"
  const isAdmin = isOwner || currentMember?.role === "admin"

  if (!activeOrg) {
    return (
      <div className="space-y-8">
        <SettingsHeader
          category="settings / team"
          title="Team"
          description="No organization selected. Create one from the sidebar switcher to manage members."
        />
      </div>
    )
  }

  return (
    <div className="space-y-16">
      <SettingsHeader
        category="settings / team"
        title="Team"
        description="People with access to this organization and the invites you've sent."
        meta={[
          { label: "organization", value: fullOrg?.name ?? activeOrg.name },
          {
            label: "members",
            value: loading ? "—" : `${fullOrg?.members.length ?? 0}`,
          },
          {
            label: "pending",
            value: loading ? "—" : `${fullOrg?.invitations.filter((i) => i.status === "pending").length ?? 0}`,
            tone: (fullOrg?.invitations.filter((i) => i.status === "pending").length ?? 0) > 0 ? "warning" : undefined,
          },
          {
            label: "your role",
            value: currentMember?.role ?? "—",
            tone: currentMember?.role === "owner" ? "primary" : undefined,
          },
        ]}
        action={
          isAdmin ? (
            <InviteMemberButton org={activeOrg.id} onChanged={refresh} />
          ) : undefined
        }
      />

      <SettingsSection
        title="Members"
        description="Everyone with an accepted membership in this organization."
        action={
          <StatusChip tone="muted" icon={<Users className="size-3" />}>
            {fullOrg?.members.length ?? 0}
          </StatusChip>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center px-6 py-10 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : !fullOrg || fullOrg.members.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Eyebrow>no members yet</Eyebrow>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {fullOrg.members.map((m) => {
              const tone = roleTone(m.role)
              const isSelf = m.userId === currentUserId
              return (
                <div
                  key={m.id}
                  className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-5 px-6 py-4"
                >
                  <Avatar className="size-9 rounded-none border border-border/70">
                    {m.user.image && <AvatarImage src={m.user.image} alt={m.user.name} />}
                    <AvatarFallback className="rounded-none bg-muted font-mono text-xs">
                      {initialsOf(m.user.name, m.user.email)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {m.user.name}
                      {isSelf && (
                        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          you
                        </span>
                      )}
                    </p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {m.user.email}
                    </p>
                  </div>

                  <StatusChip tone={tone.tone} icon={<tone.Icon className="size-3" />}>
                    {m.role}
                  </StatusChip>

                  <MemberActions
                    member={m}
                    isSelf={isSelf}
                    isOwner={isOwner}
                    isAdmin={isAdmin}
                    onChanged={refresh}
                  />
                </div>
              )
            })}
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Pending Invites"
        description="Sent invitations that haven't been accepted yet. Expire after 7 days."
      >
        {loading ? (
          <div className="flex items-center justify-center px-6 py-10 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : !fullOrg || fullOrg.invitations.filter((i) => i.status === "pending").length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Eyebrow>no pending invites</Eyebrow>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            <div className="grid grid-cols-[1.5fr_0.8fr_1fr_auto] gap-4 border-b border-border/70 bg-muted/30 px-6 py-3">
              <Eyebrow>email</Eyebrow>
              <Eyebrow>role</Eyebrow>
              <Eyebrow>expires</Eyebrow>
              <span />
            </div>
            {fullOrg.invitations
              .filter((i) => i.status === "pending")
              .map((inv) => (
                <PendingInviteRow
                  key={inv.id}
                  invitation={inv}
                  canRevoke={isAdmin}
                  onChanged={refresh}
                />
              ))}
          </div>
        )}
      </SettingsSection>

      <OrgDetailsSection
        org={fullOrg ?? null}
        canEdit={isOwner}
        canDelete={isOwner}
        onChanged={refresh}
        onDeleted={() => router.refresh()}
      />

      {refreshing && (
        <div className="fixed bottom-6 right-6 z-20 flex items-center gap-2 border border-border/80 bg-card/95 px-3 py-2 text-xs text-muted-foreground shadow-lg backdrop-blur">
          <Loader2 className="size-3.5 animate-spin" />
          syncing…
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Invite                                                                    */
/* -------------------------------------------------------------------------- */

function InviteMemberButton({ org, onChanged }: { org: string; onChanged: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<Role>("member")
  const [submitting, setSubmitting] = React.useState(false)

  const handleSubmit = async () => {
    const trimmed = email.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const result = await authClient.organization.inviteMember({
        email: trimmed,
        role,
        organizationId: org,
      })
      if (result.error) {
        toast.error(result.error.message ?? "Failed to send invite")
        return
      }
      toast.success(`Invite sent to ${trimmed}`)
      setEmail("")
      setRole("member")
      setOpen(false)
      onChanged()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        className="gap-2 font-mono text-xs uppercase tracking-[0.18em]"
        onClick={() => setOpen(true)}
      >
        <MailPlus className="size-3.5" />
        invite
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a teammate</DialogTitle>
            <DialogDescription>
              They&apos;ll receive an email with a link to accept and join this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="teammate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Role
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member — can use workflows</SelectItem>
                  <SelectItem value="admin">Admin — can invite + manage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !email.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send invite"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Member row actions                                                        */
/* -------------------------------------------------------------------------- */

function MemberActions({
  member,
  isSelf,
  isOwner,
  isAdmin,
  onChanged,
}: {
  member: FullOrgMember
  isSelf: boolean
  isOwner: boolean
  isAdmin: boolean
  onChanged: () => void
}) {
  const [busy, setBusy] = React.useState(false)
  const [confirmRemove, setConfirmRemove] = React.useState(false)

  const canActOnTarget =
    isAdmin && !isSelf && member.role !== "owner"

  const handleRoleChange = async (newRole: string) => {
    if (newRole === member.role) return
    setBusy(true)
    try {
      const result = await authClient.organization.updateMemberRole({
        memberId: member.id,
        role: newRole as "admin" | "member",
      })
      if (result.error) {
        toast.error(result.error.message ?? "Failed to update role")
        return
      }
      toast.success(`Role updated to ${newRole}`)
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async () => {
    setBusy(true)
    try {
      const result = await authClient.organization.removeMember({
        memberIdOrEmail: member.id,
      })
      if (result.error) {
        toast.error(result.error.message ?? "Failed to remove member")
        return
      }
      toast.success("Member removed")
      onChanged()
    } finally {
      setBusy(false)
      setConfirmRemove(false)
    }
  }

  if (!canActOnTarget) {
    return <span className="size-8" aria-hidden />
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Change role
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup value={member.role} onValueChange={handleRoleChange}>
            <DropdownMenuRadioItem value="admin" disabled={!isOwner}>
              Admin
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="member">Member</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setConfirmRemove(true)
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-3.5" />
            Remove from organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {member.user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to this organization&apos;s workflows, credentials and executions.
              You can re-invite them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Pending invite row                                                        */
/* -------------------------------------------------------------------------- */

function PendingInviteRow({
  invitation,
  canRevoke,
  onChanged,
}: {
  invitation: FullOrgInvitation
  canRevoke: boolean
  onChanged: () => void
}) {
  const [busy, setBusy] = React.useState(false)
  const expires = new Date(invitation.expiresAt)
  const expiresIn = Math.max(0, Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  const handleRevoke = async () => {
    setBusy(true)
    try {
      const result = await authClient.organization.cancelInvitation({
        invitationId: invitation.id,
      })
      if (result.error) {
        toast.error(result.error.message ?? "Failed to revoke invite")
        return
      }
      toast.success("Invite revoked")
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-[1.5fr_0.8fr_1fr_auto] items-center gap-4 px-6 py-4">
      <span className="truncate font-mono text-xs text-foreground">
        {invitation.email}
      </span>
      <StatusChip tone="muted">{invitation.role ?? "member"}</StatusChip>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        in {expiresIn} day{expiresIn === 1 ? "" : "s"}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRevoke}
        disabled={!canRevoke || busy}
        className="font-mono text-xs uppercase tracking-[0.18em] text-destructive hover:text-destructive"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : "revoke"}
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Org details section                                                       */
/* -------------------------------------------------------------------------- */

function OrgDetailsSection({
  org,
  canEdit,
  canDelete,
  onChanged,
  onDeleted,
}: {
  org: FullOrg | null
  canEdit: boolean
  canDelete: boolean
  onChanged: () => void
  onDeleted: () => void
}) {
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    if (org) {
      setName(org.name)
      setSlug(org.slug)
    }
  }, [org?.id, org?.name, org?.slug])

  if (!org) return null

  const dirty = name !== org.name || slug !== org.slug

  const handleSave = async () => {
    if (!dirty) return
    setSaving(true)
    try {
      const result = await authClient.organization.update({
        data: { name: name.trim(), slug: slug.trim() },
        organizationId: org.id,
      })
      if (result.error) {
        toast.error(result.error.message ?? "Failed to update organization")
        return
      }
      toast.success("Organization updated")
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await authClient.organization.delete({
        organizationId: org.id,
      })
      if (result.error) {
        toast.error(result.error.message ?? "Failed to delete organization")
        return
      }
      toast.success("Organization deleted")
      onDeleted()
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <SettingsSection
        title="Organization details"
        description="Identity for this workspace. Slug changes break invite URLs."
      >
        <SettingsRow label="Name" hint="Shown in the sidebar and emails.">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit || saving}
            className="font-mono"
          />
        </SettingsRow>
        <SettingsRow label="Slug" hint="Lowercase, hyphenated. Used in URLs.">
          <div className="flex items-center border border-input bg-transparent">
            <span className="border-r border-input px-3 py-2 font-mono text-xs text-muted-foreground">
              orchka.app /
            </span>
            <Input
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-")
                    .replace(/-+/g, "-"),
                )
              }
              disabled={!canEdit || saving}
              className="h-9 border-0 font-mono shadow-none focus-visible:ring-0"
            />
          </div>
        </SettingsRow>
        {canDelete && (
          <SettingsRow
            label="Delete organization"
            hint="Permanently destroys all workflows, credentials and executions in this org."
          >
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-3.5" />
              Delete organization…
            </Button>
          </SettingsRow>
        )}
      </SettingsSection>

      {dirty && canEdit && (
        <SettingsSaveBar hint="organization details modified">
          <Button
            variant="ghost"
            size="sm"
            className="font-mono text-xs uppercase tracking-[0.18em]"
            disabled={saving}
            onClick={() => {
              setName(org.name)
              setSlug(org.slug)
            }}
          >
            discard
          </Button>
          <Button
            size="sm"
            className="gap-2 font-mono text-xs uppercase tracking-[0.18em]"
            disabled={saving || !name.trim() || !slug.trim()}
            onClick={handleSave}
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            commit
          </Button>
        </SettingsSaveBar>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{org.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the organization and every workflow, credential, and
              execution scoped to it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="size-3.5 animate-spin" /> : "Delete forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
