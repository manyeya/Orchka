import React, { Suspense } from 'react'
import { ExecutionsContainer, ExecutionsErrorView, ExecutionsList, ExecutionsLoadingView } from '@/features/executions/components/executions'
import { prefetchExecutions } from '@/features/executions/server/prefetch'
import { HydrateClient } from '@/trpc/server'
import { ErrorBoundary } from 'react-error-boundary'
import { requireAuth } from '@/lib/auth/utils'
import type { Metadata } from 'next'
import { executionsParamsLoader } from '@/features/executions/server/params-loader'
import type { SearchParams } from 'nuqs/server'

export const metadata: Metadata = {
  title: "Executions",
  description: "View and manage your workflow executions.",
  robots: {
    index: false,
    follow: false,
  },
}

type ExecutionsPageProps = {
  searchParams: Promise<SearchParams>
}

async function ExecutionsPage({ searchParams }: ExecutionsPageProps) {
  await requireAuth()
  const params = await executionsParamsLoader(searchParams)
  await prefetchExecutions(params)
  return (
    <ExecutionsContainer>
      <HydrateClient>
        <ErrorBoundary fallback={<ExecutionsErrorView />}>
          <Suspense fallback={<ExecutionsLoadingView />}>
            <ExecutionsList />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </ExecutionsContainer>
  )
}

export default ExecutionsPage
