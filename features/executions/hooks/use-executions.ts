import { useTRPC } from "@/trpc/client"
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
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
