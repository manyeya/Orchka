'use client';

import { Button } from "@/components/ui/button";
import { useExecuteWorkflow } from "@/features/workflows/hooks/use-workflows";
import { Play } from "lucide-react";

interface ExecuteWorkflowButtonProps {
    workflowId: string;
}

export function ExecuteWorkflowButton({ workflowId }: ExecuteWorkflowButtonProps) {
    const executeWorkflow = useExecuteWorkflow()
    return (
        <Button className="cursor-pointer" size="lg" onClick={() => { executeWorkflow.mutate({ id: workflowId }) }} disabled={executeWorkflow.isPending}>
            <Play className="size-4" /> Execute Workflow
        </Button>
    );
}