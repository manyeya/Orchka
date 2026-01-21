import { Job, UnrecoverableError } from "bullmq";
import prisma from "@/lib/db";
import { topologicalSortNodes } from "@/features/editor/utils/graph-validation";
import { NodeType } from "@/features/nodes/types";
import { getExecutor } from "@/features/nodes/utils/execution/executors-registry";
import {
  resolveNodeExpressions,
  buildExpressionContext
} from "@/features/editor/utils/resolve-expressions";
import { publishWorkflowEvent } from "./publisher";
import type { BranchDecision } from "./types";
import { getCredentialForExecution, CredentialNotFoundError } from "@/lib/credentials/execution";
import { ExecutionStatus } from "@/lib/generated/prisma/client";
import { nodeQueue } from "./setup";

const CONTROL_NODE_TYPES: NodeType[] = [
  NodeType.IF_CONDITION,
  NodeType.SWITCH,
  NodeType.LOOP,
  NodeType.WAIT,
];

// ============================================================================
// Helper Functions
// ============================================================================

function filterInternalFields(context: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (!key.startsWith('__')) {
      filtered[key] = value;
    }
  }
  return filtered;
}

function isControlNode(nodeType: NodeType): boolean {
  return CONTROL_NODE_TYPES.includes(nodeType);
}

interface ConnectionWithBranch {
  fromNodeId: string;
  toNodeId: string;
  fromOutput: string;
  toInput: string;
}

function getSkippedNodes(
  controlNodeId: string,
  branchDecision: BranchDecision,
  connections: ConnectionWithBranch[]
): Set<string> {
  const skippedNodes = new Set<string>();
  const outgoingConnections = connections.filter(c => c.fromNodeId === controlNodeId);

  const nonTakenConnections = outgoingConnections.filter(
    c => c.fromOutput !== branchDecision.branch
  );

  for (const conn of nonTakenConnections) {
    const reachableFromNonTaken = findReachableNodes(conn.toNodeId, connections);

    const takenConnections = outgoingConnections.filter(
      c => c.fromOutput === branchDecision.branch
    );

    const reachableFromTaken = new Set<string>();
    for (const takenConn of takenConnections) {
      const reachable = findReachableNodes(takenConn.toNodeId, connections);
      reachable.forEach(nodeId => reachableFromTaken.add(nodeId));
    }

    for (const nodeId of reachableFromNonTaken) {
      if (!reachableFromTaken.has(nodeId)) {
        skippedNodes.add(nodeId);
      }
    }
  }

  return skippedNodes;
}

function findReachableNodes(
  startNodeId: string,
  connections: ConnectionWithBranch[]
): Set<string> {
  const reachable = new Set<string>();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (reachable.has(current)) continue;

    reachable.add(current);

    const outgoing = connections.filter(c => c.fromNodeId === current);
    for (const conn of outgoing) {
      if (!reachable.has(conn.toNodeId)) {
        queue.push(conn.toNodeId);
      }
    }
  }

  return reachable;
}

// ============================================================================
// Wait Node Handler (BullMQ-specific)
// ============================================================================

/**
 * Unit multipliers for converting duration to milliseconds
 */
const WAIT_UNIT_MULTIPLIERS: Record<string, number> = {
  seconds: 1000,
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
};

interface WaitNodeData {
  name?: string;
  mode: 'duration' | 'until';
  duration?: {
    value: number;
    unit: 'seconds' | 'minutes' | 'hours' | 'days';
  };
  until?: string;
}

/**
 * Handles WAIT node execution for BullMQ by calculating delay.
 * Instead of using step.sleep (Inngest), we return the delay
 * so the next node job can be scheduled with a delay.
 */
function handleWaitNode(
  data: Record<string, unknown>,
  nodeName: string
): { delayMs: number; output: Record<string, unknown> } {
  console.log(`[Wait Debug] handleWaitNode called with data:`, JSON.stringify(data, null, 2));
  const waitData = data as unknown as WaitNodeData;

  let delayMs = 0;
  let output: Record<string, unknown> = { completed: true, mode: waitData.mode };

  console.log(`[Wait Debug] mode=${waitData.mode}, duration=`, waitData.duration, `until=${waitData.until}`);

  if (waitData.mode === 'duration') {
    if (!waitData.duration) {
      throw new Error('Wait Node: Duration configuration is required for duration mode');
    }

    const multiplier = WAIT_UNIT_MULTIPLIERS[waitData.duration.unit] || 1000;
    delayMs = waitData.duration.value * multiplier;

    output = {
      completed: true,
      mode: 'duration',
      duration: delayMs,
    };
  } else if (waitData.mode === 'until') {
    if (!waitData.until) {
      throw new Error('Wait Node: Until timestamp is required for until mode');
    }

    const untilDate = new Date(waitData.until);
    if (isNaN(untilDate.getTime())) {
      throw new Error(`Wait Node: Invalid timestamp "${waitData.until}"`);
    }

    delayMs = Math.max(0, untilDate.getTime() - Date.now());

    output = {
      completed: true,
      mode: 'until',
      until: untilDate.toISOString(),
    };
  }

  return { delayMs, output };
}

// ============================================================================
// Job Data Types
// ============================================================================

export interface WorkflowJobData {
  workflowId: string;
  executionId: string;
  userId?: string;
  initialData?: Record<string, unknown>;
}

export interface NodeJobData {
  workflowId: string;
  executionId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  nodeData: Record<string, unknown>;
  nodeIndex: number;
  totalNodes: number;
  // Accumulated context from previous nodes - passed via job.data
  context: Record<string, unknown>;
  // Branch decisions from control nodes
  branchDecisions: Record<string, BranchDecision>;
  // Node IDs to skip
  skippedNodeIds: string[];
  // All sorted node IDs for this workflow
  sortedNodeIds: string[];
  // Previous WAIT node ID (to mark as success when this node starts)
  previousWaitNodeId?: string;
}

// ============================================================================
// Workflow Job Handler - Starts the chain by spawning first node job
// ============================================================================

export async function executeWorkflowJob(job: Job<WorkflowJobData>): Promise<any> {
  const { workflowId, executionId, initialData } = job.data;
  const jobId = job.id;

  console.log(`[Workflow] Starting workflow ${workflowId}, execution ${executionId}`);

  if (!workflowId) {
    throw new UnrecoverableError('Workflow ID is required');
  }

  if (!executionId) {
    throw new UnrecoverableError('Execution ID is required');
  }

  // Update execution with job ID
  await prisma.execution.update({
    where: { id: executionId },
    data: { inngestRunId: jobId },
  });

  // Fetch workflow
  const workflow = await prisma.workflow.findUniqueOrThrow({
    where: { id: workflowId },
    include: {
      nodes: true,
      connections: true,
    }
  });

  // Get sorted nodes
  const sortedNodes = topologicalSortNodes(workflow.nodes, workflow.connections);

  if (sortedNodes.length === 0) {
    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: ExecutionStatus.COMPLETED,
        completedAt: new Date(),
        result: {},
      }
    });
    return { success: true, result: {} };
  }

  const firstNode = sortedNodes[0];

  // Add first node job - it will chain to the next nodes
  await nodeQueue.add(
    `node:${firstNode.type}:${firstNode.name}`,
    {
      workflowId,
      executionId,
      nodeId: firstNode.id,
      nodeName: firstNode.name,
      nodeType: firstNode.type,
      nodeData: firstNode.data as Record<string, unknown>,
      nodeIndex: 0,
      totalNodes: sortedNodes.length,
      context: initialData || {},
      branchDecisions: {},
      skippedNodeIds: [],
      sortedNodeIds: sortedNodes.map(n => n.id),
    } as NodeJobData,
    {
      attempts: 3, // Per-node retry
      backoff: { type: 'exponential', delay: 1000 },
    }
  );

  console.log(`[Workflow] Queued first node: ${firstNode.name}`);

  return {
    workflowId,
    executionId,
    message: 'Workflow started, first node queued',
  };
}

// ============================================================================
// Node Job Handler - Executes a single node, chains to next
// ============================================================================

export async function executeNodeJob(job: Job<NodeJobData>): Promise<any> {
  const {
    workflowId,
    executionId,
    nodeId,
    nodeName,
    nodeType,
    nodeData,
    nodeIndex,
    totalNodes,
    context,
    branchDecisions,
    skippedNodeIds,
    sortedNodeIds,
    previousWaitNodeId,
  } = job.data;

  console.log(`[Node ${nodeIndex + 1}/${totalNodes}] Executing ${nodeName} (${nodeType})`);
  console.log(`[Node Debug] nodeType="${nodeType}", NodeType.WAIT="${NodeType.WAIT}", NodeType.LOOP="${NodeType.LOOP}"`);
  console.log(`[Node Debug] isWait=${nodeType === NodeType.WAIT}, isLoop=${nodeType === NodeType.LOOP}`);
  console.log(`[Node Debug] isControlNode=${isControlNode(nodeType as NodeType)}`);

  // If this job was delayed after a WAIT node, mark the WAIT node as success now
  if (previousWaitNodeId) {
    console.log(`[Node] Marking previous WAIT node ${previousWaitNodeId} as success (delay completed)`);
    await publishWorkflowEvent(workflowId, {
      nodeId: previousWaitNodeId,
      type: 'node-status',
      status: 'success',
      nodeType: NodeType.WAIT,
    });
  }


  // Check if this node should be skipped
  if (skippedNodeIds.includes(nodeId)) {
    console.log(`[Node] Skipping ${nodeName} - not on active branch`);

    // Chain to next node if there is one
    await chainToNextNode(job.data, context, branchDecisions, skippedNodeIds);

    return { skipped: true, nodeId, nodeName };
  }

  // Fetch workflow for expression context
  const workflow = await prisma.workflow.findUniqueOrThrow({
    where: { id: workflowId },
    include: {
      nodes: true,
      connections: true,
    }
  });

  // Build expression context
  const expressionContext = buildExpressionContext({
    nodeResults: {
      ...context,
      __branchDecisions: branchDecisions,
    },
    nodes: workflow.nodes.map(n => ({
      id: n.id,
      type: n.type,
      data: n.data as Record<string, unknown>,
    })),
    workflowId,
    workflowName: workflow.name,
    executionId,
    currentNodeId: nodeId,
  });

  // Resolve expressions in node data
  const resolvedData = await resolveNodeExpressions(nodeData, expressionContext);

  // Get executor for this node type
  const executor = getExecutor(nodeType as NodeType);

  // Create credential resolver
  const resolveCredential = async (credentialId: string) => {
    try {
      return await getCredentialForExecution(credentialId, workflowId);
    } catch (error) {
      if (error instanceof CredentialNotFoundError) {
        throw new UnrecoverableError(`Credential not found: ${credentialId}`);
      }
      throw error;
    }
  };

  // Create step record
  const stepStartedAt = new Date();
  const stepRecord = await prisma.executionStep.create({
    data: {
      executionId,
      nodeId,
      nodeName,
      nodeType,
      status: "RUNNING",
      startedAt: stepStartedAt,
      input: filterInternalFields(context) as any,
    }
  });

  try {
    const publish = async (payload: any) => {
      await publishWorkflowEvent(workflowId, payload);
    };

    // Publish starting event
    await publish({
      nodeId,
      nodeType,
      type: 'node-status',
      status: 'loading',
      input: filterInternalFields(context) as any,
    });

    let result: Record<string, unknown>;
    let delayForNextNode: number | undefined;

    // Special handling for WAIT node - use BullMQ delayed jobs instead of step.sleep
    if (nodeType === NodeType.WAIT) {
      const waitResult = handleWaitNode(resolvedData, nodeName);
      result = {
        ...context,
        [nodeName]: waitResult.output,
        __branchDecision: { branch: "main", data: waitResult.output },
      };
      delayForNextNode = waitResult.delayMs;
      console.log(`[Node] Wait node ${nodeName}: ${waitResult.delayMs}ms delay for next node`);
    } else {
      // Execute the node normally
      result = await executor({
        data: resolvedData,
        nodeId,
        context,
        expressionContext,
        publish,
        resolveCredential,
      });
    }

    const cleanOutput = filterInternalFields(result);

    // Update step record
    await prisma.executionStep.update({
      where: { id: stepRecord.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        output: cleanOutput as any,
      }
    });

    // Publish realtime event
    // For WAIT nodes with a delay, show "waiting" status until the delay completes
    const publishedStatus = (nodeType === NodeType.WAIT && delayForNextNode && delayForNextNode > 0)
      ? 'loading'  // Keep loading/waiting state
      : 'success';

    await publishWorkflowEvent(workflowId, {
      nodeId,
      input: filterInternalFields(context) as any,
      output: cleanOutput as any,
      nodeType,
      type: 'node-status',
      status: publishedStatus,
      // Include wait info for frontend to potentially show countdown
      ...(nodeType === NodeType.WAIT && delayForNextNode ? {
        waitInfo: {
          delayMs: delayForNextNode,
          endsAt: Date.now() + delayForNextNode,
        }
      } : {}),
    });

    // Update context with this node's result
    const newContext = {
      ...context,
      [nodeName]: cleanOutput,
    };

    // Handle control node branch decisions
    let newBranchDecisions = { ...branchDecisions };
    let newSkippedNodeIds = [...skippedNodeIds];

    if (isControlNode(nodeType as NodeType) && result.__branchDecision) {
      const branchDecision = result.__branchDecision as BranchDecision;
      newBranchDecisions[nodeId] = branchDecision;

      // Special handling for LOOP nodes
      if (nodeType === NodeType.LOOP && result.__loopNode) {
        const loopResult = await executeLoopBody(
          workflow,
          nodeId,
          nodeName,
          result,
          newContext,
          newBranchDecisions,
          executionId,
          workflowId,
          publish,
          resolveCredential
        );

        // Update context and skipped nodes from loop execution
        Object.assign(newContext, loopResult.context);
        newSkippedNodeIds.push(...loopResult.skippedNodeIds);
        newBranchDecisions = loopResult.branchDecisions;
      } else {
        // For IF/SWITCH - calculate skipped nodes
        const nodesToSkip = getSkippedNodes(
          nodeId,
          branchDecision,
          workflow.connections.map(c => ({
            fromNodeId: c.fromNodeId,
            toNodeId: c.toNodeId,
            fromOutput: c.fromOutput,
            toInput: c.toInput,
          }))
        );
        newSkippedNodeIds.push(...Array.from(nodesToSkip));

        console.log(`[Node] Control node ${nodeName} took branch "${branchDecision.branch}", skipping ${nodesToSkip.size} nodes`);
      }
    }

    console.log(`[Node] Completed ${nodeName}`);

    // Chain to next node (with delay if this was a WAIT node)
    await chainToNextNode(
      job.data,
      newContext,
      newBranchDecisions,
      newSkippedNodeIds,
      delayForNextNode
    );

    return {
      nodeId,
      nodeName,
      nodeType,
      output: cleanOutput,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Node execution failed";

    await prisma.executionStep.update({
      where: { id: stepRecord.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        error: errorMessage,
      }
    });

    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: ExecutionStatus.FAILED,
        completedAt: new Date(),
        error: errorMessage,
      }
    });

    console.error(`[Node] Failed ${nodeName}: ${errorMessage}`);

    // Publish error event
    await publishWorkflowEvent(workflowId, {
      nodeId,
      nodeType,
      type: 'node-status',
      status: 'error',
      error: errorMessage,
    });

    throw error;
  }
}

// ============================================================================
// Chain to Next Node
// ============================================================================

async function chainToNextNode(
  currentJobData: NodeJobData,
  newContext: Record<string, unknown>,
  newBranchDecisions: Record<string, BranchDecision>,
  newSkippedNodeIds: string[],
  delayMs?: number
): Promise<void> {
  const { workflowId, executionId, nodeType, nodeId, nodeIndex, totalNodes, sortedNodeIds } = currentJobData;

  const nextIndex = nodeIndex + 1;

  if (nextIndex >= totalNodes) {
    // All nodes completed - mark execution as complete
    const cleanResult = filterInternalFields(newContext);

    // If this was a WAIT node with a delay, mark it as success now
    if (nodeType === NodeType.WAIT && delayMs && delayMs > 0) {
      await publishWorkflowEvent(workflowId, {
        nodeId,
        type: 'node-status',
        status: 'success',
        nodeType: NodeType.WAIT,
      });
    }

    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: ExecutionStatus.COMPLETED,
        completedAt: new Date(),
        result: cleanResult as any,
      }
    });

    console.log(`[Workflow] Completed execution ${executionId}`);
    return;
  }

  // Get next node
  const workflow = await prisma.workflow.findUniqueOrThrow({
    where: { id: workflowId },
    include: { nodes: true }
  });

  const nextNodeId = sortedNodeIds[nextIndex];
  const nextNode = workflow.nodes.find(n => n.id === nextNodeId);

  if (!nextNode) {
    throw new Error(`Next node not found: ${nextNodeId}`);
  }

  // Add next node job with accumulated context
  const jobOptions: any = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  };

  // Add delay for WAIT nodes
  if (delayMs && delayMs > 0) {
    jobOptions.delay = delayMs;
    console.log(`[Node] Adding next job with ${delayMs}ms delay`);
  }

  await nodeQueue.add(
    `node:${nextNode.type}:${nextNode.name}`,
    {
      workflowId,
      executionId,
      nodeId: nextNode.id,
      nodeName: nextNode.name,
      nodeType: nextNode.type,
      nodeData: nextNode.data as Record<string, unknown>,
      nodeIndex: nextIndex,
      totalNodes,
      context: newContext,
      branchDecisions: newBranchDecisions,
      skippedNodeIds: newSkippedNodeIds,
      sortedNodeIds,
      // Pass the WAIT node ID so we can mark it as success when this job starts
      previousWaitNodeId: (nodeType === NodeType.WAIT && delayMs && delayMs > 0) ? nodeId : undefined,
    } as NodeJobData,
    jobOptions
  );

  console.log(`[Node] Chained to next node: ${nextNode.name}`);
}

// ============================================================================
// Loop Body Execution
// ============================================================================

async function executeLoopBody(
  workflow: any,
  loopNodeId: string,
  loopNodeName: string,
  result: Record<string, unknown>,
  context: Record<string, unknown>,
  branchDecisions: Record<string, BranchDecision>,
  executionId: string,
  workflowId: string,
  publish: (payload: any) => Promise<void>,
  resolveCredential: (id: string) => Promise<any>
): Promise<{
  context: Record<string, unknown>;
  skippedNodeIds: string[];
  branchDecisions: Record<string, BranchDecision>;
}> {
  const loopData = result.__loopNode as {
    nodeId: string;
    nodeName: string;
    items: unknown[];
    total: number;
    mode: string;
  };

  console.log(`[Loop Debug] executeLoopBody called for ${loopNodeName}`);
  console.log(`[Loop Debug] loopData =`, JSON.stringify(loopData, null, 2));

  // Find loop body nodes
  const loopBodyConnections = workflow.connections.filter(
    (c: any) => c.fromNodeId === loopNodeId && c.fromOutput === "loop"
  );

  console.log(`[Loop Debug] loopBodyConnections.length = ${loopBodyConnections.length}`);
  console.log(`[Loop Debug] loopBodyConnections =`, JSON.stringify(loopBodyConnections, null, 2));

  const skippedNodeIds: string[] = [];

  if (loopBodyConnections.length === 0 || loopData.items.length === 0) {
    console.log(`[Loop Debug] EARLY EXIT: loopBodyConnections.length=${loopBodyConnections.length}, items.length=${loopData.items.length}`);
    return { context, skippedNodeIds, branchDecisions };
  }

  // Get loop body node IDs
  const connections = workflow.connections.map((c: any) => ({
    fromNodeId: c.fromNodeId,
    toNodeId: c.toNodeId,
    fromOutput: c.fromOutput,
    toInput: c.toInput,
  }));

  const loopBodyNodeIds = new Set<string>();
  for (const conn of loopBodyConnections) {
    const reachable = findReachableNodes(conn.toNodeId, connections);
    reachable.forEach((id: string) => loopBodyNodeIds.add(id));
  }

  console.log(`[Loop Debug] loopBodyNodeIds before exclusion =`, Array.from(loopBodyNodeIds));

  // Exclude done branch nodes
  const doneConnections = workflow.connections.filter(
    (c: any) => c.fromNodeId === loopNodeId && c.fromOutput === "done"
  );
  for (const conn of doneConnections) {
    const reachable = findReachableNodes(conn.toNodeId, connections);
    reachable.forEach((id: string) => loopBodyNodeIds.delete(id));
  }

  console.log(`[Loop Debug] loopBodyNodeIds after exclusion =`, Array.from(loopBodyNodeIds));

  // Get sorted loop body nodes
  const loopBodyNodes = topologicalSortNodes(workflow.nodes, workflow.connections)
    .filter((n: any) => loopBodyNodeIds.has(n.id));

  console.log(`[Loop Debug] loopBodyNodes =`, loopBodyNodes.map((n: any) => ({ id: n.id, name: n.name, type: n.type })));
  console.log(`[Loop Debug] loopData.items =`, loopData.items);
  console.log(`[Loop Debug] loopBodyNodes.length =`, loopBodyNodes.length);
  console.log(`[Loop] Executing ${loopData.items.length} iterations for ${loopNodeName}`);

  const iterationResults: unknown[] = [];

  for (let index = 0; index < loopData.items.length; index++) {
    const item = loopData.items[index];
    console.log(`[Loop Debug] Starting iteration ${index + 1}/${loopData.total}, item=`, item);

    let iterationContext = {
      ...context,
      [loopNodeName]: {
        ...((context[loopNodeName] as Record<string, unknown>) || {}),
        $item: item,
        $index: index,
        $total: loopData.total,
      },
      $item: item,
      $index: index,
      $total: loopData.total,
    };

    for (const loopBodyNode of loopBodyNodes) {
      const loopExpressionContext = buildExpressionContext({
        nodeResults: { ...iterationContext, __branchDecisions: branchDecisions },
        nodes: workflow.nodes.map((n: any) => ({
          id: n.id,
          type: n.type,
          data: n.data as Record<string, unknown>,
        })),
        workflowId,
        workflowName: workflow.name,
        executionId,
        currentNodeId: loopBodyNode.id,
      });

      const resolvedLoopData = await resolveNodeExpressions(
        loopBodyNode.data as Record<string, unknown>,
        loopExpressionContext
      );

      let executorResult: Record<string, unknown>;

      // Special handling for WAIT nodes inside loop body
      if (loopBodyNode.type === NodeType.WAIT) {
        const waitNodeName = String(loopBodyNode.name || 'Wait');
        const waitResult = handleWaitNode(resolvedLoopData, waitNodeName);

        // Actually wait using setTimeout
        if (waitResult.delayMs > 0) {
          console.log(`[Loop] Wait node ${waitNodeName}: sleeping for ${waitResult.delayMs}ms`);
          await new Promise(resolve => setTimeout(resolve, waitResult.delayMs));
        }

        executorResult = {
          ...iterationContext,
          [waitNodeName]: waitResult.output,
          __branchDecision: { branch: "main", data: waitResult.output },
        };
      } else {
        const loopExecutor = getExecutor(loopBodyNode.type as NodeType);
        executorResult = await loopExecutor({
          data: resolvedLoopData,
          nodeId: loopBodyNode.id,
          context: iterationContext as any,
          expressionContext: loopExpressionContext,
          publish,
          resolveCredential,
        });
      }

      iterationContext = { ...iterationContext, ...executorResult };

      // Publish status for the loop body node being executed
      await publish({
        nodeId: loopBodyNode.id,
        type: 'node-status',
        status: 'success',
        input: filterInternalFields({ $item: item, $index: index, $total: loopData.total }) as any,
        output: filterInternalFields(iterationContext) as any,
        nodeType: loopBodyNode.type,
        iteration: { index, total: loopData.total },
      });

      // Also publish iteration progress for the LOOP node itself
      await publish({
        nodeId: loopNodeId,
        type: 'node-status',
        status: 'loading',
        nodeType: NodeType.LOOP,
        iteration: { index: index + 1, total: loopData.total },
      });
    }

    iterationResults.push({
      item,
      index,
      result: filterInternalFields(iterationContext),
    });
  }

  // Mark loop body nodes as skipped for main execution flow
  skippedNodeIds.push(...Array.from(loopBodyNodeIds));

  // Update branch decision to done
  const doneBranchDecision: BranchDecision = {
    branch: "done",
    data: { results: iterationResults, total: loopData.total, mode: loopData.mode },
  };

  const newContext = {
    ...context,
    [loopNodeName]: {
      items: loopData.items,
      total: loopData.total,
      mode: loopData.mode,
      results: iterationResults,
      $item: loopData.items[loopData.items.length - 1],
      $index: loopData.items.length - 1,
      $total: loopData.total,
    },
  };

  console.log(`[Loop] Completed all ${iterationResults.length} iterations`);

  // Publish success status for the loop node now that all iterations are done
  await publish({
    nodeId: loopNodeId,
    type: 'node-status',
    status: 'success',
    nodeType: NodeType.LOOP,
    output: {
      items: loopData.items,
      total: loopData.total,
      mode: loopData.mode,
      results: iterationResults,
    },
  });

  return {
    context: newContext,
    skippedNodeIds,
    branchDecisions: { ...branchDecisions, [loopNodeId]: doneBranchDecision },
  };
}
