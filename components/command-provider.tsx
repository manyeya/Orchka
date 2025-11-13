"use client"

import { createContext, useContext, ReactNode } from "react"
import { CommandPalette } from "./command-palette"
import { useCommandPalette } from "@/hooks/use-command-palette"

interface CommandContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const CommandContext = createContext<CommandContextType | undefined>(undefined)

export function useCommand() {
  const context = useContext(CommandContext)
  if (context === undefined) {
    throw new Error("useCommand must be used within a CommandProvider")
  }
  return context
}

interface CommandProviderProps {
  children: ReactNode
}

export function CommandProvider({ children }: CommandProviderProps) {
  const { open, setOpen } = useCommandPalette()

  return (
    <CommandContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </CommandContext.Provider>
  )
}
