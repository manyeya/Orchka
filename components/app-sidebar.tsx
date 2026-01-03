"use client"

import * as React from "react"
import {
  Settings2,
  Workflow,
  Activity,
  KeyRound,
  Clock,
  LayoutTemplate,
  BarChart3,
  GalleryVerticalEnd,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "manyeya",
    email: "manyeya@example.com",
    avatar: "/avatars/manyeya.jpg",
  },
  teams: [
    {
      name: "Project Orc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Workflows",
      url: "/workflows",
      icon: Workflow,
    },
    {
      title: "Executions",
      url: "/executions",
      icon: Activity,
    },
    {
      title: "Credentials",
      url: "/credentials",
      icon: KeyRound,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
    },
  ],
  projects: [
    {
      name: "Recent Workflows",
      url: "#",
      icon: Clock,
    },
    {
      name: "Templates",
      url: "#",
      icon: LayoutTemplate,
    },
    {
      name: "Analytics",
      url: "#",
      icon: BarChart3,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
