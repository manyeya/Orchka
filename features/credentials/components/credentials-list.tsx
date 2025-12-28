"use client"

import { useSuspenseCredentials, useDeleteCredential } from "../hooks/use-credentials"
import { Key, MoreVerticalIcon, Trash2, Pencil, Loader2Icon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { EntityList } from "@/components/entity-component"
import { getCredentialTypeLabel, CredentialType } from "@/lib/credentials/types"

interface CredentialMetadata {
    id: string
    name: string
    type: CredentialType
    createdAt: Date
    updatedAt: Date
}

interface CredentialsListProps {
    onEdit: (credential: CredentialMetadata) => void
    onCreate: () => void
}

export const CredentialsList = ({ onEdit, onCreate }: CredentialsListProps) => {
    const credentials = useSuspenseCredentials()

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <EntityList
                    className="gap-px bg-border/40"
                    items={credentials.data}
                    render={(credential) => (
                        <CredentialItem credential={credential} onEdit={onEdit} />
                    )}
                    getKey={(credential) => credential.id}
                    emptyView={<CredentialsEmptyView onCreate={onCreate} />}
                />
            </div>
        </div>
    )
}

interface CredentialItemProps {
    credential: CredentialMetadata
    onEdit: (credential: CredentialMetadata) => void
}

const CredentialItem = ({ credential, onEdit }: CredentialItemProps) => {
    const { mutateAsync: deleteCredential, isPending: isDeleting } = useDeleteCredential()

    return (
        <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 hover:bg-muted/30 transition-all bg-card/40 border-l-4 border-l-transparent hover:border-l-primary/50">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Key className="h-5 w-5 text-muted-foreground" />
                </div>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
                <h3 className="text-sm font-semibold truncate">
                    {credential.name}
                </h3>
                <div className="flex items-center text-xs text-muted-foreground gap-2">
                    <span>Created {formatDistanceToNow(new Date(credential.createdAt), { addSuffix: true })}</span>
                    <span className="hidden sm:inline text-muted-foreground/40">|</span>
                    <span className="hidden sm:inline">Updated {formatDistanceToNow(new Date(credential.updatedAt), { addSuffix: true })}</span>
                </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <Badge variant="secondary" className="gap-1 font-normal bg-secondary/50 hover:bg-secondary/70">
                    {getCredentialTypeLabel(credential.type)}
                </Badge>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(credential)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteCredential({ id: credential.id })}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

interface CredentialsEmptyViewProps {
    onCreate: () => void
}

const CredentialsEmptyView = ({ onCreate }: CredentialsEmptyViewProps) => {
    return (
        <Empty className="py-12">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Key />
                </EmptyMedia>
                <EmptyTitle>No Credentials Yet</EmptyTitle>
                <EmptyDescription>
                    You haven&apos;t added any credentials yet. Add your first credential
                    to connect to external services.
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
                <Button onClick={onCreate}>Add Credential</Button>
            </EmptyContent>
        </Empty>
    )
}

export const CredentialsLoadingView = () => {
    return (
        <Empty className="h-full">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Loader2Icon className="animate-spin" />
                </EmptyMedia>
                <EmptyTitle>Loading Credentials</EmptyTitle>
                <EmptyDescription>Please wait...</EmptyDescription>
            </EmptyHeader>
        </Empty>
    )
}

export const CredentialsErrorView = () => {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Key />
                </EmptyMedia>
                <EmptyTitle>Error loading credentials</EmptyTitle>
                <EmptyDescription>
                    Something went wrong while loading credentials. Please try again.
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    )
}
