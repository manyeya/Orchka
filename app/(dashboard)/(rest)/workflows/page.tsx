import React, { Suspense } from 'react'
import { WorkflowsContainer, WorkflowsList } from '@/features/workflows/components/workflows'
import { prefetchWorkflows } from '@/features/workflows/server/prefetch'
import { HydrateClient } from '@/trpc/server'
import { ErrorBoundary } from 'react-error-boundary'
import { requireAuth } from '@/lib/auth/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Workflows",
  description: "Manage and monitor your automated workflows in Orchka.",
  robots: {
    index: false,
    follow: false,
  },
}

async function WorkflowPage() {
  await requireAuth()
  prefetchWorkflows()
  return (
    <WorkflowsContainer>
      <HydrateClient>
        <ErrorBoundary fallback={<p>Something went wrong</p>}>
          <Suspense fallback={<p>Loading...</p>}>
            <WorkflowsList />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </WorkflowsContainer>
  )
}

export default WorkflowPage
