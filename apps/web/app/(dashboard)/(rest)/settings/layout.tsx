"use client"

import { SettingsSidebar } from "@/components/settings-sidebar"

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full">
      <SettingsSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-10 md:px-12 md:py-12">
          {children}
        </div>
      </main>
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
