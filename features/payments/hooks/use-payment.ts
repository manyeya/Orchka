import { authClient } from "@/lib/auth/client"
import { useQuery } from "@tanstack/react-query"

const usePayments = () => {
    return useQuery({
        queryKey: ["payments"],
        queryFn: async () => {
            const { data } = await authClient.customer.state();
            return data;
        }
    })
}

export const useSubscription = () => {
    const { data: customer, isLoading, ...rest } = usePayments();

    const activeSubscriptions = customer?.activeSubscriptions && customer.activeSubscriptions.length > 0;

    return {
        hasSubscription: activeSubscriptions,
        subscription: customer?.activeSubscriptions?.[0],
        isLoading,
        ...rest
    }
}

export default usePayments
