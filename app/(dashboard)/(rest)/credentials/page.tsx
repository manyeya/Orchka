import React from 'react'
import { Key, ArrowUpRight } from "lucide-react"

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

async function CredentialsPage() {
  await requireAuth()
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Key />
        </EmptyMedia>
        <EmptyTitle>No Credentials Yet</EmptyTitle>
        <EmptyDescription>
          You haven't added any credentials yet. Add your first credential
          to connect to external services.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button>Add Credential</Button>
          <Button variant="outline">Import Credential</Button>
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

export default CredentialsPage
