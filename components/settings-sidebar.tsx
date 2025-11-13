"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSettingsSidebarContext } from "./settings-sidebar-provider"

export function SettingsSidebar() {
  const pathname = usePathname()
  const { collapsed, settingsNav } = useSettingsSidebarContext()

  if (collapsed) {
    return (
      <div className="w-16 border-r bg-muted/10 flex flex-col items-center py-6">
        <nav className="space-y-2">
          {settingsNav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                prefetch
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
                title={item.title}
              >
                <Icon className="h-4 w-4" />
              </Link>
            )
          })}
        </nav>
      </div>
    )
  }

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
              prefetch
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
