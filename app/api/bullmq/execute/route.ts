import { NextRequest, NextResponse } from 'next/server';
import { workflowQueue, webhookQueue } from '@/bullmq/setup';
import prisma from '@/lib/db';

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

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const job = await workflowQueue.add('execute-workflow', {
      workflowId,
      executionId,
      userId: workflow.userId,
      initialData,
    });

    return NextResponse.json({
      success: true,
      executionId,
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
