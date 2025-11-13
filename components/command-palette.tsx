"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Bot,
  BookOpen,
  Settings2,
  SquareTerminal,
  Plus,
  CreditCard,
  Users,
  Gauge,
  LogOut,
  Moon,
  Sun,
  Monitor,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useCreateWorkflow } from "@/features/workflows/hooks/use-workflows"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const { mutate: createWorkflow } = useCreateWorkflow()

  const runCommand = React.useCallback((command: () => void) => {
    onOpenChange(false)
    command()
  }, [onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/workflows"))}
          >
            <SquareTerminal className="mr-2 h-4 w-4" />
            <span>Go to Workflows</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/executions"))}
          >
            <Bot className="mr-2 h-4 w-4" />
            <span>Go to Executions</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/credentials"))}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Go to Credentials</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/settings"))}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            <span>Go to Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => {
              createWorkflow()
              router.push("/workflows")
            })}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Create New Workflow</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/credentials"))}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Create New Credential</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/settings/billing"))}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/settings/limits"))}
          >
            <Gauge className="mr-2 h-4 w-4" />
            <span>Limits</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/settings/team"))}
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Team</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Theme</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Theme</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>System Theme</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem
            onSelect={() => runCommand(() => {
              // Handle logout - you might want to implement this
              console.log("Logout")
            })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
