import { Card } from "@/components/ui/card"
import { SettingsSidebarProvider } from "@/components/settings-sidebar-provider"
import { SettingsSidebar } from "@/components/settings-sidebar"

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <SettingsSidebarProvider>
      <div className="flex h-full">
        <SettingsSidebar />
        <div className="flex-1 p-6">
          <Card className="p-6 h-full">
            {children}
          </Card>
        </div>
      </div>
    </SettingsSidebarProvider>
  )
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SettingsLayoutContent>{children}</SettingsLayoutContent>
}
