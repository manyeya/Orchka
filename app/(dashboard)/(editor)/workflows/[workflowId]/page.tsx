import React from 'react'

interface WorkflowPageProps {
    params: Promise<{
        workflowId: string
    }>
}

async function WorkflowPage({ params }: WorkflowPageProps) {
    const { workflowId } = await params
  return (
    <div>WorkflowPage {workflowId}</div>
  )
}

export default WorkflowPage