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

//remove a workflow
export const useRemoveWorkflow = () => {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    return useMutation(trpc.workflows.removeWorkflow.mutationOptions({
        onSuccess: (data) => {
            toast.success(`Workflow "${data.name}" removed successfully`)
            queryClient.invalidateQueries(trpc.workflows.getWorkflows.queryOptions({}))
            queryClient.invalidateQueries(trpc.workflows.getOneWorkflow.queryOptions({ id: data.id }))
        },
        onError: (error) => {
            toast.error(`Failed to remove workflow: ${error.message}`)
        }
    }))
}

//get a single workflow
export const useSuspenseWorkflow = (id: string) => {
    const trpc = useTRPC()
    return useSuspenseQuery(trpc.workflows.getOneWorkflow.queryOptions({ id }))
}

//update workflow name
export const useUpdateWorkflowName = () => {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    return useMutation(trpc.workflows.updateWorkflowName.mutationOptions({
        onSuccess: (data) => {
            toast.success(`Workflow "${data.name}" updated successfully`)
            queryClient.invalidateQueries(trpc.workflows.getWorkflows.queryOptions({}))
            queryClient.invalidateQueries(trpc.workflows.getOneWorkflow.queryOptions({ id: data.id }))
        },
        onError: (error) => {
            toast.error(`Failed to update workflow: ${error.message}`)
        }
    }))
}

//update workflow
export const useUpdateWorkflow = () => {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    return useMutation(trpc.workflows.updateWorkflow.mutationOptions({
        onSuccess: (data) => {
            toast.success(`Workflow "${data.name}" updated successfully`)
            queryClient.invalidateQueries(trpc.workflows.getWorkflows.queryOptions({}))
            queryClient.invalidateQueries(trpc.workflows.getOneWorkflow.queryOptions({ id: data.id }))
        },
        onError: (error) => {
            toast.error(`Failed to update workflow: ${error.message}`)
        }
    }))
}

//execute workflow
export const useExecuteWorkflow = () => {
    const trpc = useTRPC()
    return useMutation(trpc.workflows.executeWorkflow.mutationOptions({
        onSuccess: (data) => {
            toast.success(`Workflow "${data.name}" started successfully`)
        },
        onError: (error) => {
            toast.error(`Failed to execute workflow: ${error.message}`)
        }
    }))
}

//schedule workflow (for cron triggers)
export const useScheduleWorkflow = () => {
    const trpc = useTRPC()
    return useMutation(trpc.workflows.scheduleWorkflow.mutationOptions({
        onSuccess: (data) => {
            toast.success(`Workflow "${data.name}" scheduled successfully with pattern: ${data.cronPattern}`)
        },
        onError: (error) => {
            toast.error(`Failed to schedule workflow: ${error.message}`)
        }
    }))
}

//unschedule workflow
export const useUnscheduleWorkflow = () => {
    const trpc = useTRPC()
    return useMutation(trpc.workflows.unscheduleWorkflow.mutationOptions({
        onSuccess: (data) => {
            toast.success(`Workflow "${data.name}" unscheduled successfully`)
        },
        onError: (error) => {
            toast.error(`Failed to unschedule workflow: ${error.message}`)
        }
    }))
}

//get schedule status
export const useScheduleStatus = (workflowId: string) => {
    const trpc = useTRPC()
    return useSuspenseQuery(trpc.workflows.getScheduleStatus.queryOptions({ id: workflowId }))
}