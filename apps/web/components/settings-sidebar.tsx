"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSettingsSidebar } from "@/hooks/use-settings-sidebar"
import { cn } from "@/lib/utils"

export function SettingsSidebar() {
  const pathname = usePathname()
  const { settingsNav } = useSettingsSidebar()

  return (
    <aside className="w-64 hidden md:flex flex-col border-r bg-muted/5">
      <nav className="flex-1 p-4 space-y-0.5">
        {settingsNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                isActive
                  ? "bg-accent text-accent-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-accent-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
              )} />
              <div className="flex flex-col min-w-0">
                <span className="truncate leading-none">{item.title}</span>
                {/* Description removed for a cleaner look, or could be kept if wanted */}
              </div>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
