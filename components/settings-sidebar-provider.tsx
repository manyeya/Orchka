"use client"

import { createContext, useContext, ReactNode } from "react"
import { useSettingsSidebar, SettingsNavItem } from "@/hooks/use-settings-sidebar"

interface SettingsSidebarContextType {
  activeItem: string
  setActiveItem: (item: string) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  settingsNav: SettingsNavItem[]
}

const SettingsSidebarContext = createContext<SettingsSidebarContextType | undefined>(undefined)

export function useSettingsSidebarContext() {
  const context = useContext(SettingsSidebarContext)
  if (context === undefined) {
    throw new Error("useSettingsSidebarContext must be used within a SettingsSidebarProvider")
  }
  return context
}

interface SettingsSidebarProviderProps {
  children: ReactNode
}

export function SettingsSidebarProvider({ children }: SettingsSidebarProviderProps) {
  const { activeItem, setActiveItem, collapsed, setCollapsed, settingsNav } = useSettingsSidebar()

  return (
    <SettingsSidebarContext.Provider
      value={{
        activeItem,
        setActiveItem,
        collapsed,
        setCollapsed,
        settingsNav,
      }}
    >
      {children}
    </SettingsSidebarContext.Provider>
  )
}
