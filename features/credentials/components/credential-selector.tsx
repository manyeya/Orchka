"use client"

import { useTRPC } from "@/trpc/client"
import { useQuery } from "@tanstack/react-query"
import { CredentialType, getCredentialTypeLabel } from "@/lib/credentials/types"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Key, Loader2Icon, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Node credential configuration interface
 * Requirements: 3.2 - Store credential reference in node config
 */
export interface NodeCredentialConfig {
    credentialId: string
    credentialType: CredentialType
}

interface CredentialSelectorProps {
    /** The credential type to filter by - Requirements: 3.5 */
    type: CredentialType
    /** Currently selected credential ID */
    value?: string
    /** Callback when credential selection changes - Requirements: 3.2 */
    onChange: (config: NodeCredentialConfig | null) => void
    /** Optional placeholder text */
    placeholder?: string
    /** Optional className for styling */
    className?: string
    /** Whether the selector is disabled */
    disabled?: boolean
}

/**
 * Credential selector component for workflow nodes
 * Requirements: 3.1, 3.2, 3.5
 * 
 * - Displays a dropdown of compatible credentials filtered by type (3.1, 3.5)
 * - Stores credential reference (credentialId and credentialType) in node config (3.2)
 */
export const CredentialSelector = ({
    type,
    value,
    onChange,
    placeholder = "Select credential...",
    className,
    disabled = false,
}: CredentialSelectorProps) => {
    const trpc = useTRPC()
    
    // Fetch credentials filtered by type - Requirements: 3.5
    const { data: credentials, isLoading, error } = useQuery(
        trpc.credentials.list.queryOptions({ type })
    )

    const handleValueChange = (selectedId: string) => {
        if (selectedId === "__none__") {
            onChange(null)
            return
        }
        
        // Store credential reference with both ID and type - Requirements: 3.2
        onChange({
            credentialId: selectedId,
            credentialType: type,
        })
    }

    if (error) {
        return (
            <div className={cn("flex items-center gap-2 text-sm text-destructive", className)}>
                <AlertCircle className="h-4 w-4" />
                <span>Failed to load credentials</span>
            </div>
        )
    }

    return (
        <Select
            value={value ?? "__none__"}
            onValueChange={handleValueChange}
            disabled={disabled || isLoading}
        >
            <SelectTrigger className={cn("w-full", className)}>
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                        <span className="text-muted-foreground">Loading...</span>
                    </div>
                ) : (
                    <SelectValue placeholder={placeholder} />
                )}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="__none__">
                    <span className="text-muted-foreground">No credential selected</span>
                </SelectItem>
                {credentials && credentials.length > 0 ? (
                    credentials.map((credential) => (
                        <SelectItem key={credential.id} value={credential.id}>
                            <div className="flex items-center gap-2">
                                <Key className="h-4 w-4 text-muted-foreground" />
                                <span>{credential.name}</span>
                            </div>
                        </SelectItem>
                    ))
                ) : (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        No {getCredentialTypeLabel(type)} credentials found.
                        <br />
                        Create one in the Credentials page.
                    </div>
                )}
            </SelectContent>
        </Select>
    )
}

/**
 * Hook to get credentials filtered by type
 * Useful for components that need credential data without the selector UI
 */
export const useCredentialsByType = (type: CredentialType) => {
    const trpc = useTRPC()
    return useQuery(trpc.credentials.list.queryOptions({ type }))
}

/**
 * Helper function to extract credential config from node data
 * Returns null if no valid credential config is found
 */
export function getCredentialConfigFromNodeData(
    nodeData: Record<string, unknown>
): NodeCredentialConfig | null {
    const credentialId = nodeData.credentialId
    const credentialType = nodeData.credentialType
    
    if (
        typeof credentialId === "string" &&
        typeof credentialType === "string" &&
        Object.values(CredentialType).includes(credentialType as CredentialType)
    ) {
        return {
            credentialId,
            credentialType: credentialType as CredentialType,
        }
    }
    
    return null
}

/**
 * Helper function to set credential config in node data
 * Returns a new object with the credential config merged in
 */
export function setCredentialConfigInNodeData(
    nodeData: Record<string, unknown>,
    config: NodeCredentialConfig | null
): Record<string, unknown> {
    if (config === null) {
        // Remove credential config from node data
        const { credentialId, credentialType, ...rest } = nodeData
        return rest
    }
    
    return {
        ...nodeData,
        credentialId: config.credentialId,
        credentialType: config.credentialType,
    }
}
