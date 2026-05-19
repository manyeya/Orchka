"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Building2, Check, ChevronDown, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@orchka/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@orchka/ui/dialog"
import { Input } from "@orchka/ui/input"
import { Label } from "@orchka/ui/label"
import { Button } from "@orchka/ui/button"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@orchka/ui/sidebar"
import { cn } from "@orchka/ui/utils"

import {
  authClient,
  useActiveOrganization,
  useListOrganizations,
} from "@/features/auth/client"

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function TeamSwitcher() {
  const router = useRouter()
  const { data: organizations, isPending: orgsPending } = useListOrganizations()
  const { data: activeOrg, isPending: activePending } = useActiveOrganization()

  const [createOpen, setCreateOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [creating, setCreating] = React.useState(false)
  const [slugTouched, setSlugTouched] = React.useState(false)
  const [switchingId, setSwitchingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!slugTouched) setSlug(slugify(name))
  }, [name, slugTouched])

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === activeOrg?.id) return
    setSwitchingId(organizationId)
    try {
      const result = await authClient.organization.setActive({ organizationId })
      if (result.error) {
        toast.error(result.error.message ?? "Failed to switch organization")
        return
      }
      router.refresh()
    } finally {
      setSwitchingId(null)
    }
  }

  const handleCreate = async () => {
    const trimmedName = name.trim()
    const finalSlug = (slugTouched ? slug : slugify(trimmedName)).trim()
    if (!trimmedName || !finalSlug) {
      toast.error("Name and slug are required")
      return
    }
    setCreating(true)
    try {
      const result = await authClient.organization.create({
        name: trimmedName,
        slug: finalSlug,
      })
      if (result.error) {
        toast.error(result.error.message ?? "Failed to create organization")
        return
      }
      toast.success(`Organization "${trimmedName}" created`)
      const newId = result.data?.id
      if (newId) {
        await authClient.organization.setActive({ organizationId: newId })
      }
      setCreateOpen(false)
      setName("")
      setSlug("")
      setSlugTouched(false)
      router.refresh()
    } finally {
      setCreating(false)
    }
  }

  const loading = orgsPending || activePending
  const orgs = organizations ?? []

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="w-fit px-1.5">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
                  {activeOrg?.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeOrg.logo}
                      alt={activeOrg.name}
                      className="size-3 object-cover"
                    />
                  ) : (
                    <Building2 className="size-3" />
                  )}
                </div>
                <span className="truncate font-medium">
                  {loading
                    ? "Loading…"
                    : activeOrg?.name ?? "No organization"}
                </span>
                <ChevronDown className="opacity-50" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 rounded-lg"
              align="start"
              side="bottom"
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs uppercase tracking-[0.18em] font-mono">
                Organizations
              </DropdownMenuLabel>
              {orgs.length === 0 && !loading && (
                <div className="px-2 py-3 text-xs text-muted-foreground">
                  You aren&apos;t in any organization yet.
                </div>
              )}
              {orgs.map((org) => {
                const isActive = org.id === activeOrg?.id
                const isSwitching = switchingId === org.id
                return (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleSwitch(org.id)}
                    disabled={isSwitching}
                    className={cn(
                      "gap-2 p-2",
                      isActive && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="flex size-6 items-center justify-center rounded-xs border bg-background">
                      {org.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={org.logo} alt="" className="size-4 object-cover" />
                      ) : (
                        <Building2 className="size-3.5 shrink-0" />
                      )}
                    </div>
                    <span className="flex-1 truncate">{org.name}</span>
                    {isSwitching ? (
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                    ) : (
                      isActive && <Check className="size-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onSelect={(e) => {
                  e.preventDefault()
                  setCreateOpen(true)
                }}
              >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  New organization
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New organization</DialogTitle>
            <DialogDescription>
              Create a workspace for a new team. You&apos;ll become its owner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Name
              </Label>
              <Input
                id="org-name"
                placeholder="Acme Inc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-slug" className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Slug
              </Label>
              <div className="flex items-center border border-input bg-transparent">
                <span className="border-r border-input px-3 py-2 font-mono text-xs text-muted-foreground">
                  orchka.app /
                </span>
                <Input
                  id="org-slug"
                  placeholder="acme"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(slugify(e.target.value))
                  }}
                  className="h-9 border-0 font-mono shadow-none focus-visible:ring-0"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Lowercase, hyphenated. Auto-generated from the name.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !name.trim() || !slug.trim()}>
              {creating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
