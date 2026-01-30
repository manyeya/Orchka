import { prefetch, trpc } from "@/trpc/server";

export const prefetchBullMQStats = async () => {
    return prefetch(trpc.admin.getBullMQStats.queryOptions());
}
