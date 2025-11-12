import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.workflows.getWorkflows>;

export const prefetchWorkflows = (params: Input) => {
    prefetch(trpc.workflows.getWorkflows.infiniteQueryOptions(params));
}