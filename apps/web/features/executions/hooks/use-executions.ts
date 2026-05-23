import { useTRPC } from "@/trpc/client"
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { useExecutionsParams } from "./use-executions-params"

export const useSuspenseExecutions = () => {
  const trpc = useTRPC()
  const [params] = useExecutionsParams()
  return useSuspenseQuery(trpc.executions.list.queryOptions(params))
}

export const useSuspenseExecution = (id: string) => {
  const trpc = useTRPC()
  return useSuspenseQuery(trpc.executions.getById.queryOptions({ id }))
}

export const useExecutionsByWorkflow = (workflowId: string) => {
  const trpc = useTRPC()
  return useQueryClient().fetchQuery(trpc.executions.getByWorkflowId.queryOptions({ workflowId }))
}

export const useSuspenseExecutionsStats = (windowDays = 30) => {
  const trpc = useTRPC()
  return useSuspenseQuery(trpc.executions.stats.queryOptions({ windowDays }))
}

export const useSuspenseExecutionsSeries = (windowDays = 30) => {
  const trpc = useTRPC()
  return useSuspenseQuery(trpc.executions.series.queryOptions({ windowDays }))
}

/**
 * Fetch the latest execution for a workflow (with steps) for hydrating the editor.
 * Not suspending: editor should render even if there are no executions yet.
 */
export const useLatestExecutionForWorkflow = (workflowId: string | null | undefined) => {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.executions.getLatestForWorkflow.queryOptions({ workflowId: workflowId ?? "" }),
    enabled: !!workflowId,
  })
}
