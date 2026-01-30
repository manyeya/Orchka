import { PAGINATION } from "@/config/constants"
import { useEffect, useState } from "react"

interface UseEntitySearchProps<T extends {
    search: string
    page: number
}> {
    params: T
    setParams: (params: T | ((prev: T) => T)) => void
    debounceMs?: number
}

export const useEntitySearch = <T extends {
    search: string
    page: number
}>({ params, setParams, debounceMs = 300 }: UseEntitySearchProps<T>) => {
    const [localSearch, setLocalSearch] = useState(params.search)

    useEffect(() => {
        if (localSearch === "") {
            setParams(prev => prev.search !== "" ? { ...prev, search: "", page: PAGINATION.DEFAULT_PAGE } : prev)
            return;
        }
        const timeout = setTimeout(() => {
            setParams(prev => ({ ...prev, search: localSearch, page: PAGINATION.DEFAULT_PAGE }))
        }, debounceMs)
        return () => clearTimeout(timeout)
    }, [localSearch, setParams, debounceMs])

    return {
        searchValue: localSearch,
        onSearchChange: setLocalSearch,
    }
}
