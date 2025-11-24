'use client';
import { ErrorView, LoadingView } from '@/components/entity-component';
import { useSuspenseWorkflow } from '@/features/workflows/hooks/use-workflows';

export const EditorLoadingView = () => {
    return (
        <LoadingView entity="Editor" />
    )
}

export const EditorErrorView = () => {
    return (
        <ErrorView entity="Editor" />
    )
}

function Editor({ workflowId }: { workflowId: string }) {
    const { data: workflow } = useSuspenseWorkflow(workflowId)
    return (
        <div>
            {JSON.stringify(workflow, null, 2)}
        </div>
    )
}

export default Editor