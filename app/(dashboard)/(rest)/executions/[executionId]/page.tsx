import React, { Suspense } from 'react'
import { requireAuth } from '@/lib/auth/utils'
import { prefetchExecution } from '@/features/executions/server/prefetch'
import { HydrateClient } from '@/trpc/server'
import { ErrorBoundary } from 'react-error-boundary'
import { ExecutionDetailView, ExecutionLoadingView, ExecutionErrorView } from '@/features/executions/components/execution-detail'
import type { Metadata } from 'next'

interface ExecutionPageProps {
    params: Promise<{
        executionId: string
    }>
}

export const metadata: Metadata = {
  title: "Execution Details",
  description: "View execution details and results.",
}

async function ExecutionPage({ params }: ExecutionPageProps) {
  await requireAuth()
  const { executionId } = await params
  await prefetchExecution(executionId)
  
  return (
    <HydrateClient>
      <ErrorBoundary fallback={<ExecutionErrorView />}>
        <Suspense fallback={<ExecutionLoadingView />}>
          <ExecutionDetailView executionId={executionId} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  )
}   

export default ExecutionPage