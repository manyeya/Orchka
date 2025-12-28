"use client"

import { useTRPC } from "@/trpc/client"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { CredentialType } from "@/lib/credentials/types"
import { useCredentialsParams } from "./use-credentials-params"

// Get all credentials for the current user with pagination
export const useSuspenseCredentials = () => {
    const trpc = useTRPC()
    const [params] = useCredentialsParams()
    return useSuspenseQuery(trpc.credentials.list.queryOptions(params))
}

// Create a new credential
export const useCreateCredential = () => {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    return useMutation(trpc.credentials.create.mutationOptions({
        onSuccess: (data) => {
            toast.success(`Credential "${data.name}" created successfully`)
            queryClient.invalidateQueries(trpc.credentials.list.queryOptions({}))
        },
        onError: (error) => {
            toast.error(`Failed to create credential: ${error.message}`)
        }
    }))
}

// Update an existing credential
export const useUpdateCredential = () => {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    return useMutation(trpc.credentials.update.mutationOptions({
        onSuccess: (data) => {
            toast.success(`Credential "${data.name}" updated successfully`)
            queryClient.invalidateQueries(trpc.credentials.list.queryOptions({}))
        },
        onError: (error) => {
            toast.error(`Failed to update credential: ${error.message}`)
        }
    }))
}

// Delete a credential
export const useDeleteCredential = () => {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    return useMutation(trpc.credentials.delete.mutationOptions({
        onSuccess: () => {
            toast.success("Credential deleted successfully")
            queryClient.invalidateQueries(trpc.credentials.list.queryOptions({}))
        },
        onError: (error) => {
            toast.error(`Failed to delete credential: ${error.message}`)
        }
    }))
}

// Get a single credential by ID
export const useCredential = (id: string) => {
    const trpc = useTRPC()
    return useSuspenseQuery(trpc.credentials.getById.queryOptions({ id }))
}

// Test a credential
export const useTestCredential = () => {
    const trpc = useTRPC()
    return useMutation(trpc.credentials.test.mutationOptions({
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Credential test successful!")
            } else {
                toast.error(`Credential test failed: ${data.error}`)
            }
        },
        onError: (error) => {
            toast.error(`Failed to test credential: ${error.message}`)
        }
    }))
}
