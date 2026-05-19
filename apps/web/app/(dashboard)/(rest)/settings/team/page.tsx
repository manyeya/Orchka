import { Metadata } from "next"
import { TeamSettingsClient } from "./team-client"

export const metadata: Metadata = {
  title: "Team",
  description: "Manage team members, invites and organization details.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function TeamSettingsPage() {
  return <TeamSettingsClient />
}
