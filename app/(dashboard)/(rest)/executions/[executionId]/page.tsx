import React from 'react'
import { requireAuth } from '@/lib/auth/utils'
interface ExecutionPageProps {
    params: Promise<{
        executionId: string
    }>
}

//http://localhost:3000/executions/1



async function ExecutionPage({ params }: ExecutionPageProps) {
  await requireAuth()
    const { executionId } = await params
  return (
    <div>ExecutionPage {executionId}</div>
  )
}   

export default ExecutionPage