import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const useBullMQStats = () => {
    const trpc = useTRPC();

    return useSuspenseQuery({
        ...trpc.admin.getBullMQStats.queryOptions(),
    });
};
