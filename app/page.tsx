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
  return (
    <div className="font-sans ">
      <CurrentUser />
      <ul>
        {workflows && workflows.length > 0 ? workflows?.map((workflow) => (
          <li key={workflow.id}>{workflow.name}</li>
        )) : <li>No workflows</li>}
      </ul>
      <Button disabled={createWorkflow.isPending} onClick={() => createWorkflow.mutate()}>Create Workflow</Button>
    </div>
  );
}
