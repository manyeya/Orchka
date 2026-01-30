import { NextRequest, NextResponse } from 'next/server';
import { workflowQueue } from "@orchka/workflow-engine/setup";
import prisma from "@orchka/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workflowId, initialData } = body;

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Create the Execution record BEFORE adding the job to the queue
    const execution = await prisma.execution.create({
      data: {
        workflowId,
        userId: workflow.userId,
        // status defaults to RUNNING in schema
      },
    });

    const job = await workflowQueue.add('execute-workflow', {
      workflowId,
      executionId: execution.id,
      userId: workflow.userId,
      initialData,
    });

    return NextResponse.json({
      success: true,
      executionId: execution.id,
      jobId: job.id,
    });
  } catch (error) {
    console.error('[Execute API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}
