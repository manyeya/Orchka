import React, { Suspense } from 'react'
import { prefetchWorkflow } from '@/features/workflows/server/prefetch'
import { HydrateClient } from '@/trpc/server'
import { ErrorBoundary } from 'react-error-boundary'
import { EditorErrorView, EditorLoadingView } from '@/features/editor/components/editor'
import Editor from '@/features/editor/components/editor'
import { EditorHeader } from '@/features/editor/components/editor-header'
import { CommandProvider } from '@/components/command-provider'

interface WorkflowPageProps {
  params: Promise<{
    workflowId: string
  }>
}

async function WorkflowPage({ params }: WorkflowPageProps) {
  const { workflowId } = await params
  prefetchWorkflow(workflowId)
  return (
    <div className="flex flex-1 flex-col h-screen">
      <CommandProvider>
        <HydrateClient>
          <ErrorBoundary fallback={<EditorErrorView />}>
            <Suspense fallback={<EditorLoadingView />}>
              <EditorHeader workflowId={workflowId} />
              <main className="flex-1">
                <Editor workflowId={workflowId} />
              </main>
            </Suspense>
          </ErrorBoundary>
        </HydrateClient>
      </CommandProvider>
    </div>
  )
}

export default WorkflowPage