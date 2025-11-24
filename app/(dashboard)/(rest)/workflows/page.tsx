import React, { Suspense } from 'react'
import { WorkflowsContainer, WorkflowsErrorView, WorkflowsList, WorkflowsLoadingView } from '@/features/workflows/components/workflows'
import { prefetchWorkflows } from '@/features/workflows/server/prefetch'
import { HydrateClient } from '@/trpc/server'
import { ErrorBoundary } from 'react-error-boundary'
import { requireAuth } from '@/lib/auth/utils'
import type { Metadata } from 'next'
import { workflowsParamsLoader } from '@/features/workflows/server/params-loader'
import type { SearchParams } from 'nuqs/server'

export const metadata: Metadata = {
  title: "Workflows",
  description: "Manage and monitor your automated workflows in Orchka.",
  robots: {
    index: false,
    follow: false,
  },
}

type WorkflowPageProps = {
  searchParams: Promise<SearchParams>
}

async function WorkflowPage({ searchParams }: WorkflowPageProps) {
  await requireAuth()
  const params = await workflowsParamsLoader(searchParams)
  prefetchWorkflows(params)
  return (
    <WorkflowsContainer>
      <HydrateClient>
        <ErrorBoundary fallback={<WorkflowsErrorView />}>
          <Suspense fallback={<WorkflowsLoadingView />}>
            <WorkflowsList />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </WorkflowsContainer>
  )
}

export default WorkflowPage
