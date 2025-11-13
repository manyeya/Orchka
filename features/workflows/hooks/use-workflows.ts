import { useTRPC } from "@/trpc/client"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useWorkflowsParams } from "./use-workflows-params"

// get all workflows
export const useSuspenseWorkflows = () => {
    const trpc = useTRPC()
    const [params] = useWorkflowsParams()
    return useSuspenseQuery(trpc.workflows.getWorkflows.queryOptions(params))
}

//create a new workflow
export const useCreateWorkflow = () => {
    const trpc = useTRPC()
    const router = useRouter()
    const queryClient = useQueryClient()
    return useMutation(trpc.workflows.createWorkflow.mutationOptions({
        onSuccess: (data) => {
            toast.success(`Workflow ${data.name} created successfully`)
            router.push(`/workflows/${data.id}`)
            queryClient.invalidateQueries(trpc.workflows.getWorkflows.queryOptions({}))
        },
        onError: (error) => {
            toast.error(`Failed to create workflow: ${error.message}`)
        }
    }))
}

