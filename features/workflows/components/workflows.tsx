"use client"

import { useSuspenseWorkflows, useCreateWorkflow } from "../hooks/use-workflows"
import { FolderCode, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { EntityContainer, EntityHeader } from "@/components/entity-component"
import { useUpgradeModal } from "@/features/payments/hooks/use-upgrade-modal"

export const WorkflowsList = () => {
    const workflows = useSuspenseWorkflows()
    const { isPending, mutate } = useCreateWorkflow()
    const { modal, handleError } = useUpgradeModal()

    if (workflows.data.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <FolderCode />
                    </EmptyMedia>
                    <EmptyTitle>No Workflows Yet</EmptyTitle>
                    <EmptyDescription>
                        You havent created any workflows yet. Get started by creating
                        your first workflow.
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <div className="flex gap-2">
                        <Button disabled={isPending} onClick={() => mutate()}>Create Workflow</Button>
                        <Button variant="outline">Import Workflow</Button>
                    </div>
                </EmptyContent>
                <Button
                    variant="link"
                    asChild
                    className="text-muted-foreground"
                    size="sm"
                >
                    <a href="#">
                        Learn More <ArrowUpRight />
                    </a>
                </Button>
            </Empty>
        )
    }

    return (
        <ul>
            {workflows.data.map((workflow) => (
                <li key={workflow.id}>{workflow.name}</li>
            ))}
        </ul>
    )
}


const WorkflowsHeader = () => {
    const { isPending, mutate } = useCreateWorkflow()
    const { modal, handleError } = useUpgradeModal()
    return (
        <>
            {modal}
            <EntityHeader
                title="Workflows"
                description="Manage your workflows"
                newButtonLabel="Create Workflow"
                onNew={() => mutate(undefined,{
                    onError: (error) => {
                        handleError(error)
                    }
                })}
                disabled={isPending}
            />
        </>
    )
}

export const WorkflowsContainer = ({ children }: { children: React.ReactNode }) => {
    return (
        <EntityContainer
            header={<WorkflowsHeader />}
        >
            {children}
        </EntityContainer>
    )
}

