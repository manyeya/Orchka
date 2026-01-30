import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.workflows.getWorkflows>;

export const prefetchWorkflows = async (params?: Input) => {
    return prefetch(trpc.workflows.getWorkflows.queryOptions(params ?? {}));
}

//prefetch a single workflow
export const prefetchWorkflow = (id: string) => {
    prefetch(trpc.workflows.getOneWorkflow.queryOptions({ id }));
}
