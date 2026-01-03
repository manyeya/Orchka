import { prefetch, trpc } from "@/trpc/server";
import type { inferInput } from "@trpc/tanstack-react-query";

type Input = inferInput<typeof trpc.executions.list>;

export const prefetchExecutions = async (params?: Input) => {
  return prefetch(trpc.executions.list.queryOptions(params ?? {}));
}

export const prefetchExecution = (id: string) => {
  prefetch(trpc.executions.getById.queryOptions({ id }));
}
