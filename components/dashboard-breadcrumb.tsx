"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

const pathMap: Record<string, string> = {
  "/workflows": "Workflows",
  "/credentials": "Credentials",
  "/executions": "Executions",
  "/settings": "Settings",
  "/settings/team": "Team",
  "/settings/billing": "Billing",
  "/settings/limits": "Limits",
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()

  // Remove the /dashboard prefix if it exists
  const cleanPath = pathname.replace(/^\/dashboard/, "")

  // Split path into segments
  const segments = cleanPath.split("/").filter(Boolean)

  // Build breadcrumb items
  const breadcrumbItems = []
  let currentPath = ""

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`

    // Check if this is a dynamic route (contains brackets or is an ID)
    const isDynamic = segment.includes("[") || /^\d+$/.test(segment)

    if (isDynamic) {
      // For dynamic routes, show a generic name or skip
      if (segment === "[workflowId]") {
        breadcrumbItems.push({
          label: "Workflow",
          href: currentPath,
          isLast: i === segments.length - 1,
        })
      } else if (segment === "[credentialId]") {
        breadcrumbItems.push({
          label: "Credential",
          href: currentPath,
          isLast: i === segments.length - 1,
        })
      } else if (segment === "[executionId]") {
        breadcrumbItems.push({
          label: "Execution",
          href: currentPath,
          isLast: i === segments.length - 1,
        })
      }
    } else {
      // Use mapped name or capitalize the segment
      const label = pathMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1)
      breadcrumbItems.push({
        label,
        href: currentPath,
        isLast: i === segments.length - 1,
      })
    }
  }

  // If no segments, show Dashboard
  if (breadcrumbItems.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems.map((item, index) => (
          <div key={item.href} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={`/dashboard${item.href}`}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
