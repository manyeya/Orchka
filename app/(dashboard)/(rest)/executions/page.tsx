import React from 'react'
import { Play, ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { requireAuth } from '@/lib/auth/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Executions",
  description: "View and manage your workflow executions.",
  robots: {
    index: false,
    follow: false,
  },
}

async function ExecutionsPage() {
  await requireAuth()
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Play />
        </EmptyMedia>
        <EmptyTitle>No Executions Yet</EmptyTitle>
        <EmptyDescription>
          You havent run any workflow executions yet. Start by running
          your first workflow.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button>Run Workflow</Button>
          <Button variant="outline">View Workflows</Button>
        </div>
      </EmptyContent>
      <Button
        variant="link"
        asChild
        className="text-muted-foreground"
        size="sm"
      >
        <a href="#">
          Learn More <ArrowUpRight />
        </a>
      </Button>
    </Empty>
  )
}

export default ExecutionsPage
