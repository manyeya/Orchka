'use client'

import { Button } from "@/components/ui/button";
import { CurrentUser } from "@/features/auth/current-user";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";


export default function Home() {
  const trpc = useTRPC()
  const { data: workflows } = useQuery(trpc.getWorkflows.queryOptions())
  const createWorkflow = useMutation(trpc.createWorkflow.mutationOptions({
    onSuccess: () => {
      toast.success("Job Queued")
    }
  }))

  const ai = useMutation(trpc.ai.mutationOptions({
    onSuccess: () => {
      toast.success("Testing AI Successful")
    },
    onError: (ctx => {
      toast.error(ctx.message)
    })
  }))

  return (
    <div className="font-sans ">
      <CurrentUser />
      <ul>
        {workflows && workflows.length > 0 ? workflows?.map((workflow) => (
          <li key={workflow.id}>{workflow.name}</li>
        )) : <li>No workflows</li>}
      </ul>
      <Button disabled={createWorkflow.isPending} onClick={() => createWorkflow.mutate()}>Create Workflow</Button>
      <Button disabled={ai.isPending} onClick={() => ai.mutate()}>Test AI</Button>
    </div>
  );
}
