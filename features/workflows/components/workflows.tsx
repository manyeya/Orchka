"use client"

import { useSuspenseWorkflows, useCreateWorkflow, useRemoveWorkflow } from "../hooks/use-workflows"
import { FolderCode } from "lucide-react"

import { EmptyView, EntityContainer, EntityHeader, EntityItem, EntityList, EntityPagination, EntitySearch, ErrorView, LoadingView } from "@/components/entity-component"
import { useUpgradeModal } from "@/features/payments/hooks/use-upgrade-modal"
import { useWorkflowsParams } from "../hooks/use-workflows-params"
import { useEntitySearch } from "@/hooks/use-entity-search"
import { useRouter } from "next/navigation"
import { Workflow } from "@/lib/generated/prisma/client"
import { formatDistanceToNow } from "date-fns"

export const WorkflowsList = () => {
    const workflows = useSuspenseWorkflows()
    // const { isPending, mutate } = useCreateWorkflow()
    // const { modal, handleError } = useUpgradeModal()

    return (
        <EntityList
            items={workflows.data.items}
            render={(workflow) => (
                <WorkflowsItem workflow={workflow} />
            )}
            getKey={(workflow) => workflow.id}
            emptyView={<WorkflowsEmptyView />}
        />
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
                onNew={() => mutate(undefined, {
                    onError: (error) => {
                        handleError(error)
                    }
                })}
                disabled={isPending}
            />
        </>
    )
}

const WorkflowsSearch = () => {
    const [params, setParams] = useWorkflowsParams()
    const { searchValue, onSearchChange } = useEntitySearch({ params, setParams })
    return (
        <EntitySearch value={searchValue} onChange={onSearchChange} placeholder="Search Workflows" />
    )
}

const WorkflowsPagination = () => {
    const [params, setParams] = useWorkflowsParams()
    const workflows = useSuspenseWorkflows()
    return (
        <EntityPagination
            page={workflows.data.page}
            totalPages={workflows.data.totalPages}
            onPageChange={(page) => setParams({ ...params, page })}
            disabled={workflows.isFetching}
        />
    )
}

export const WorkflowsContainer = ({ children }: { children: React.ReactNode }) => {
    return (
        <EntityContainer
            header={<WorkflowsHeader />}
            search={<WorkflowsSearch />}
            pagination={<WorkflowsPagination />}
        >
            {children}
        </EntityContainer>
    )
}

export const WorkflowsLoadingView = () => {
    return (
        <LoadingView entity="Workflows" />
    )
}

export const WorkflowsEmptyView = () => {
    const { isPending, mutate } = useCreateWorkflow()
    const { modal, handleError } = useUpgradeModal()
    const router = useRouter()
    return (
        <>
            {modal}
            <EmptyView entity="Workflows" isPending={isPending} onNew={() => mutate(
                undefined,
                {
                    onError: (error) => {
                        handleError(error)
                    },
                    onSuccess: (data) => {
                        router.push(`/workflows/${data.id}`)
                    }
                }
            )} canBeImported icon={<FolderCode />} />
        </>
    )
}

export const WorkflowsErrorView = () => {
    return (
        <ErrorView entity="Workflows" />
    )
}

export const WorkflowsItem = ({ workflow }: { workflow: Workflow }) => {
    const { mutateAsync: removeWorkflow, isPending: isRemoving } = useRemoveWorkflow()
    return (
        <EntityItem
            href={`/workflows/${workflow.id}`}
            title={workflow.name}
            subtitle={
                <>
                    Updated {formatDistanceToNow(workflow.updatedAt, { addSuffix: true })}{" "}
                    &bull;{" "}
                    Created {formatDistanceToNow(workflow.createdAt, { addSuffix: true })}
                </>
            }
            image={workflow.name.charAt(0)}
            onRemove={async () => {
                await removeWorkflow({ id: workflow.id })
            }}
            isRemoving={isRemoving}
        />
    )
}
