"use client"

import React, { Suspense, useState } from 'react'
import { Key, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CredentialsList, CredentialsLoadingView, CredentialsErrorView, CredentialsToolbar } from '@/features/credentials/components/credentials-list'
import { CredentialForm } from '@/features/credentials/components/credential-form'
import { useCreateCredential, useUpdateCredential } from '@/features/credentials/hooks/use-credentials'
import { CredentialType } from '@/lib/credentials/types'
import { ErrorBoundary } from 'react-error-boundary'

interface CredentialMetadata {
    id: string
    name: string
    type: CredentialType
    createdAt: Date
    updatedAt: Date
}

function CredentialsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCredential, setEditingCredential] = useState<CredentialMetadata | null>(null)

    const { mutate: createCredential, isPending: isCreating } = useCreateCredential()
    const { mutate: updateCredential, isPending: isUpdating } = useUpdateCredential()

    const handleCreate = () => {
        setEditingCredential(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (credential: CredentialMetadata) => {
        setEditingCredential(credential)
        setIsDialogOpen(true)
    }

    const handleSubmit = (values: { name: string; type: CredentialType; data: Record<string, unknown> }) => {
        if (editingCredential) {
            updateCredential(
                { id: editingCredential.id, name: values.name, data: values.data },
                {
                    onSuccess: () => {
                        setIsDialogOpen(false)
                        setEditingCredential(null)
                    }
                }
            )
        } else {
            createCredential(values, {
                onSuccess: () => {
                    setIsDialogOpen(false)
                }
            })
        }
    }

    return (
        <div className="w-full p-6 md:p-8 max-w-[1600px] mx-auto h-full bg-background text-foreground">
            {/* Header */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-row items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Credentials</h1>
                        <p className="text-muted-foreground">Manage your API keys and authentication credentials</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Credential
                    </Button>
                </div>
            </div>

            {/* Credentials List */}
            <ErrorBoundary fallback={<CredentialsErrorView />}>
                <Suspense fallback={<CredentialsLoadingView />}>
                    <CredentialsToolbar />
                    <CredentialsList onEdit={handleEdit} onCreate={handleCreate} />
                </Suspense>
            </ErrorBoundary>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCredential ? 'Edit Credential' : 'Add Credential'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCredential
                                ? 'Update your credential details below.'
                                : 'Add a new credential to connect to external services.'}
                        </DialogDescription>
                    </DialogHeader>
                    <CredentialForm
                        defaultValues={editingCredential ? {
                            name: editingCredential.name,
                            type: editingCredential.type,
                            data: {},
                        } : undefined}
                        onSubmit={handleSubmit}
                        isSubmitting={isCreating || isUpdating}
                        submitLabel={editingCredential ? 'Update Credential' : 'Create Credential'}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CredentialsPage
