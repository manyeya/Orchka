import { PAGINATION } from "@/config/constants"
import { useEffect, useState } from "react"

interface UseEntitySearchProps<T extends {
    search: string
    page: number
}> {
    params: T
    setParams: (params: T) => void
    debounceMs?: number
}

export const useEntitySearch = <T extends {
    search: string
    page: number
}>({ params, setParams, debounceMs = 300 }: UseEntitySearchProps<T>) => {
    const [localSearch, setLocalSearch] = useState(params.search)

    useEffect(() => {
        if (localSearch === "" && params.search !== "") {
            setParams({ ...params, search: "", page: PAGINATION.DEFAULT_PAGE })
            return;
        }
        const timeout = setTimeout(() => {
            setParams({ ...params, search: localSearch, page: PAGINATION.DEFAULT_PAGE })
        }, debounceMs)
        return () => clearTimeout(timeout)
    }, [localSearch, params, setParams, debounceMs])

    return {
        searchValue: localSearch,
        onSearchChange: setLocalSearch,
    }
}

