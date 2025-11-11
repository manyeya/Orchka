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
  const cleanPath = pathname.replace(/^\//, "")

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

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <div key={item.href} className="flex items-center justify-center">
            {index > 0 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage className="ml-2">{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
