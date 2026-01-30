"use client"

import { SettingsSidebar } from "@/components/settings-sidebar"

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <SettingsSidebar />
      <main className="overflow-y-auto p-8 mx-auto">
        {children}
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
