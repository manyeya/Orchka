import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Input } from '@/components/ui/input'
import { useSuspenseWorkflow, useUpdateWorkflowName } from '@/features/workflows/hooks/use-workflows'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const EditorNameInput = ({ workflowId }: { workflowId: string }) => {
    const { data: workflow } = useSuspenseWorkflow(workflowId)
    const updateWorkflowName = useUpdateWorkflowName()
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(workflow.name)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (workflow.name) {
            setName(workflow.name)
        }
    }, [workflow.name])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const handleSaveName = async () => {
        if (name === workflow.name) {
            setIsEditing(false)
            return
        }

        try {
            setIsEditing(false)
            await updateWorkflowName.mutateAsync({
                id: workflowId,
                name
            })
        } catch (error) {
            setName(workflow.name)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSaveName()
        } else if (e.key === 'Escape') {
            setIsEditing(false)
        }
    }

    return (
        <BreadcrumbItem className='cursor-pointer hover:text-foreground transition-colors'>
            {isEditing ? (
                <Input
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={handleKeyDown}
                    disabled={updateWorkflowName.isPending}
                />
            ) : (
                <span onClick={() => setIsEditing(true)}>
                    {workflow.name}
                </span>
            )}
        </BreadcrumbItem>
    )
}

const EditorBreadcrum = ({ workflowId }: { workflowId: string }) => {
    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/workflows" prefetch>
                            Workflows
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <EditorNameInput workflowId={workflowId} />
            </BreadcrumbList>
        </Breadcrumb>
    )
}

export default EditorBreadcrum