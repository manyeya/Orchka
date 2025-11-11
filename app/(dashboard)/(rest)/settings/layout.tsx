"use client"

import { Card } from "@/components/ui/card"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings, Users, CreditCard, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const settingsNav = [
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
]

function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-[calc(var(--spacing) * 100)] border-r bg-muted/10">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>
      <nav className="space-y-1 px-3">
        {settingsNav.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <div className="flex flex-col">
                <span>{item.title}</span>
                <span className="text-xs text-muted-foreground/70">
                  {item.description}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <SettingsSidebar />
      <div className="flex-1 p-6">
        <Card className="p-6 h-full">
          {children}
        </Card>
      </div>
    </div>
  )
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SettingsLayoutContent>{children}</SettingsLayoutContent>
}
