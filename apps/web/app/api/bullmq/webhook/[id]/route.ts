import { NextRequest, NextResponse } from 'next/server';
import { webhookQueue } from "@orchka/workflow-engine/setup";
import prisma from "@orchka/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workflowId = params.id;

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const body = await req.json();

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const job = await webhookQueue.add('webhook-trigger', {
      workflowId,
      executionId,
      userId: workflow.userId,
      payload: body,
      headers: Object.fromEntries(req.headers.entries()),
    });

    return NextResponse.json({
      success: true,
      executionId,
      jobId: job.id,
    });
  } catch (error) {
    console.error('[Webhook API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
