"use client"

import { Settings, Users, CreditCard, BarChart3, Zap } from "lucide-react"

export interface SettingsNavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

export function useSettingsSidebar() {
  const settingsNav: SettingsNavItem[] = [
    {
      title: "General",
      href: "/settings",
      icon: Settings,
      description: "Application settings and preferences",
    },
    {
      title: "Team",
      href: "/settings/team",
      icon: Users,
      description: "Manage team members and permissions",
    },
    {
      title: "Billing",
      href: "/settings/billing",
      icon: CreditCard,
      description: "Subscription and payment management",
    },
    {
      title: "Limits",
      href: "/settings/limits",
      icon: BarChart3,
      description: "Usage limits and resource quotas",
    },
    {
      title: "Engine",
      href: "/settings/engine",
      icon: Zap,
      description: "BullMQ background task processing engine",
    },
  ]

  return {
    settingsNav,
  }
}
