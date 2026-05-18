"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSettingsSidebar } from "@/hooks/use-settings-sidebar"
import { cn } from "@orchka/ui/utils"

export function SettingsSidebar() {
  const pathname = usePathname()
  const { settingsNav } = useSettingsSidebar()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/70 bg-muted/30 md:flex">
      <div className="border-b border-border/70 px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="size-1.5 bg-primary" aria-hidden />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            control panel
          </span>
        </div>
        <h2 className="mt-2 text-base font-semibold tracking-tight text-foreground">
          Configuration
        </h2>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-px">
          {settingsNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                    "border-l-2 border-transparent",
                    isActive
                      ? "border-l-primary bg-background text-foreground"
                      : "text-muted-foreground hover:border-l-foreground/30 hover:bg-background/60 hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground/70 group-hover:text-foreground",
                    )}
                  />
                  <span className="truncate font-medium leading-none">
                    {item.title}
                  </span>
                  {isActive && (
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                      active
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-border/70 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            engine
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-500 dark:text-emerald-400">
            <span className="size-1.5 animate-pulse bg-current" aria-hidden />
            online
          </span>
        </div>
      </div>
    </aside>
  )
}
