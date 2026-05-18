import { Metadata } from "next"
import { GeneralSettingsForm } from "./general-form"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your application settings and preferences.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SettingsPage() {
  return <GeneralSettingsForm />
}
