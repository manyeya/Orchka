import { Job, UnrecoverableError } from "bullmq";

import prisma from "@orchka/db";
import { ExecutionStatus } from "@orchka/db/enums";
import { NodeType } from "@orchka/nodes/core";
import {
  CONTROL_NODE_TYPES,
  VISUAL_NODE_TYPES,
  getExecutor,
} from "@orchka/nodes/runtime";

import { topologicalSortNodes } from "./utils";
import {
  resolveNodeExpressions,
  buildExpressionContext
} from "@orchka/expression-engine/resolve-expressions";

import { publishWorkflowEvent } from "./publisher";
import type { BranchDecision } from "./types";

import {
  getCredentialForExecution,
  CredentialNotFoundError,
} from "@orchka/credentials-core/execution";

import { nodeQueue } from "./setup";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

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
  return CONTROL_NODE_TYPES.has(nodeType);
}

function isVisualOnlyNode(nodeType: NodeType): boolean {
  return VISUAL_NODE_TYPES.has(nodeType);
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
// Step Persistence Helper (Redis → DB)
// ============================================================================

/**
 * Persist execution steps from Redis to database.
 * Called on workflow completion/failure to ensure data isn't lost.
 */
async function persistExecutionSteps(executionId: string, workflowId: string): Promise<void> {
  try {
    const historyKey = `workflow:${workflowId}:execution:${executionId}:history`;
    const redisEvents = await redis.lrange(historyKey, 0, 100);

    if (redisEvents.length === 0) {
      console.log(`[Persist Steps] No events in Redis for execution ${executionId}`);
      return;
    }

    // Build steps from Redis events
    const nodeStates = new Map<string, {
      startedAt: number | null;
      completedAt: number | null;
      nodeName: string;
      nodeType: string;
      input: any;
      output: any;
      status: string;
      error: string | null;
    }>();

    for (const eventStr of redisEvents.reverse()) {
      try {
        const { payload, timestamp } = JSON.parse(eventStr);
        if (payload.type !== 'node-status') continue;

        const nodeId = payload.nodeId;
        const state = nodeStates.get(nodeId) || {
          startedAt: null,
          completedAt: null,
          nodeName: '',
          nodeType: '',
          input: null,
          output: null,
          status: 'PENDING',
          error: null,
        };

        if (payload.status === 'loading' && !state.startedAt) {
          state.startedAt = timestamp;
          state.nodeName = payload.nodeName || '';
          state.nodeType = payload.nodeType || '';
          state.input = payload.input;
          state.status = 'RUNNING';
        } else if (payload.status === 'success') {
          state.completedAt = timestamp;
          state.output = payload.output;
          state.status = 'COMPLETED';
        } else if (payload.status === 'error') {
          state.completedAt = timestamp;
          state.error = payload.error;
          state.status = 'FAILED';
        }

        nodeStates.set(nodeId, state);
      } catch (e) {
        console.error('[Persist Steps] Failed to parse event:', e);
      }
    }

    // Convert to Prisma format and bulk insert
    const steps = Array.from(nodeStates.entries())
      .filter(([, state]) => state.startedAt !== null)
      .map(([nodeId, state]) => ({
        id: `${executionId}-${nodeId}`,
        executionId,
        nodeId,
        nodeName: state.nodeName,
        nodeType: state.nodeType,
        status: state.status as "RUNNING" | "COMPLETED" | "FAILED",
        startedAt: new Date(state.startedAt!),
        completedAt: state.completedAt ? new Date(state.completedAt) : null,
        input: state.input,
        output: state.output,
        error: state.error,
      }));

    if (steps.length > 0) {
      await prisma.executionStep.createMany({
        data: steps,
        skipDuplicates: true,
      });
      console.log(`[Persist Steps] Persisted ${steps.length} steps to DB for execution ${executionId}`);
    }
  } catch (e) {
    console.error('[Persist Steps] Failed to persist steps:', e);
    // Don't throw - we don't want to fail the execution if persistence fails
  }
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
  const waitData = data as unknown as WaitNodeData;

  let delayMs = 0;
  let output: Record<string, unknown> = { completed: true, mode: waitData.mode };

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

// Serialized workflow data for passing through jobs (avoids repeated DB fetches)
export interface SerializedWorkflow {
  id: string;
  name: string;
  userId: string;
  nodes: Array<{ id: string; type: string; name: string; data: Record<string, unknown> }>;
  connections: Array<{ fromNodeId: string; toNodeId: string; fromOutput: string; toInput: string }>;
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
  // Dependency tracking for branch-level execution
  // Array of [nodeId, parentIds] tuples (Map doesn't serialize in JSON)
  dependencies?: [string, string[]][];
  // Array of node IDs that have completed execution
  completedNodeIds?: string[];
  // OPTIMIZATION: Pass workflow data to avoid repeated DB fetches
  workflowData?: SerializedWorkflow;
}

// ============================================================================
// Workflow Job Handler - Starts the chain by spawning first node job
// ============================================================================

export async function executeWorkflowJob(job: Job<WorkflowJobData>): Promise<any> {
  let { workflowId, executionId, initialData } = job.data;
  const jobId = job.id;

  console.log(`[Workflow] Starting workflow ${workflowId}, execution ${executionId}`);

  if (!workflowId) {
    throw new UnrecoverableError('Workflow ID is required');
  }

  // For scheduled jobs (from cron triggers), executionId may not exist
  // We need to create the execution record
  if (!executionId) {
    console.log(`[Workflow] No execution ID provided (scheduled run), creating execution record...`);

    // Fetch workflow to get userId
    const workflow = await prisma.workflow.findUniqueOrThrow({
      where: { id: workflowId },
    });

    // Create execution record for scheduled run
    const execution = await prisma.execution.create({
      data: {
        workflowId,
        userId: workflow.userId,
        inngestRunId: jobId,
      }
    });

    executionId = execution.id;
    console.log(`[Workflow] Created execution ${executionId} for scheduled run`);
  } else {
    // Update existing execution with job ID
    await prisma.execution.update({
      where: { id: executionId },
      data: { inngestRunId: jobId },
    });
  }

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

  // Build dependency map: for each node, which parent nodes must complete first?
  const dependencies = new Map<string, string[]>();
  const incomingMap = new Map<string, string[]>();

  // Initialize empty arrays for all nodes
  for (const node of workflow.nodes) {
    incomingMap.set(node.id, []);
  }

  // Build incoming edges map
  for (const conn of workflow.connections) {
    const incoming = incomingMap.get(conn.toNodeId) || [];
    incoming.push(conn.fromNodeId);
    incomingMap.set(conn.toNodeId, incoming);
  }

  // Store the dependencies
  for (const [nodeId, parents] of incomingMap.entries()) {
    dependencies.set(nodeId, parents);
  }

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

  // Serialize workflow data to pass through jobs (avoids repeated DB fetches)
  const workflowData: SerializedWorkflow = {
    id: workflow.id,
    name: workflow.name,
    userId: workflow.userId,
    nodes: workflow.nodes.map(n => ({
      id: n.id,
      type: n.type,
      name: n.name,
      data: n.data as Record<string, unknown>,
    })),
    connections: workflow.connections.map(c => ({
      fromNodeId: c.fromNodeId,
      toNodeId: c.toNodeId,
      fromOutput: c.fromOutput,
      toInput: c.toInput,
    })),
  };

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
      // Pass dependencies and empty completed set
      dependencies: Array.from(dependencies.entries()),
      completedNodeIds: [],
      // OPTIMIZATION: Pass workflow data to avoid repeated DB fetches
      workflowData,
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
    previousWaitNodeId,
    dependencies: depsArray,
    completedNodeIds: completed,
    workflowData,
  } = job.data;

  // Reconstruct Map from array (Maps don't serialize in JSON)
  const dependencies = new Map<string, string[]>(depsArray || []);
  const completedNodeIds = new Set(completed || []);

  console.log(`[Node ${nodeIndex + 1}/${totalNodes}] Executing ${nodeName} (${nodeType})`);
  console.log(`[Node Debug] nodeType="${nodeType}", NodeType.WAIT="${NodeType.WAIT}", NodeType.LOOP="${NodeType.LOOP}"`);
  console.log(`[Node Debug] isWait=${nodeType === NodeType.WAIT}, isLoop=${nodeType === NodeType.LOOP}`);
  console.log(`[Node Debug] isControlNode=${isControlNode(nodeType as NodeType)}`);

  // If this job was delayed after a WAIT node, mark the WAIT node as success now
  if (previousWaitNodeId) {
    console.log(`[Node] Marking previous WAIT node ${previousWaitNodeId} as success (delay completed)`);
    await publishWorkflowEvent(workflowId, executionId, {
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
    await chainToNextNode(
      job.data,
      context,
      branchDecisions,
      skippedNodeIds,
      undefined,
      dependencies,
      completedNodeIds
    );

    return { skipped: true, nodeId, nodeName };
  }

  // Skip visual-only nodes (ANNOTATION, GROUP) - they don't have execution logic
  if (isVisualOnlyNode(nodeType as NodeType)) {
    console.log(`[Node] Skipping ${nodeName} (${nodeType}) - visual-only node`);

    // Chain to next node without creating any execution history
    await chainToNextNode(
      job.data,
      context,
      branchDecisions,
      skippedNodeIds,
      undefined,
      dependencies,
      completedNodeIds
    );

    return { skipped: true, nodeId, nodeName, reason: 'visual-only' };
  }

  // OPTIMIZATION: Use passed workflowData instead of fetching from DB
  // If workflowData is not available (old jobs), fall back to DB fetch
  let workflow: SerializedWorkflow;
  if (workflowData) {
    workflow = workflowData;
  } else {
    const dbWorkflow = await prisma.workflow.findUniqueOrThrow({
      where: { id: workflowId },
      include: {
        nodes: true,
        connections: true,
      }
    });
    workflow = {
      id: dbWorkflow.id,
      name: dbWorkflow.name,
      userId: dbWorkflow.userId,
      nodes: dbWorkflow.nodes.map(n => ({
        id: n.id,
        type: n.type,
        name: n.name,
        data: n.data as Record<string, unknown>,
      })),
      connections: dbWorkflow.connections.map(c => ({
        fromNodeId: c.fromNodeId,
        toNodeId: c.toNodeId,
        fromOutput: c.fromOutput,
        toInput: c.toInput,
      })),
    };
  }

  // Build expression context
  const expressionContext = buildExpressionContext({
    nodeResults: {
      ...context,
      __branchDecisions: branchDecisions,
    },
    nodes: workflow.nodes.map(n => ({
      id: n.id,
      type: n.type,
      data: n.data,
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

  // Track step timing for the publisher (no DB write - Redis handles real-time updates)
  const stepStartedAt = Date.now();

  try {
    const publish = async (payload: any) => {
      await publishWorkflowEvent(workflowId, executionId, payload);
    };

    // Publish starting event
    await publish({
      nodeId,
      nodeName,
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
      // Don't spread context here - orchestrator handles accumulation
      result = {
        [nodeName]: waitResult.output,
        __branchDecision: { branch: "main", data: waitResult.output },
      };
      delayForNextNode = waitResult.delayMs;
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

    // FIX: Extract only this node's own output (executors spread context, but we handle accumulation here)
    // Executors return { ...context, [nodeName]: output }, so we extract just the [nodeName] property
    const extractedOutput = (result as Record<string, unknown>)[nodeName];
    const nodeOutput: Record<string, unknown> = extractedOutput != null
      ? (extractedOutput as Record<string, unknown>)
      : cleanOutput;

    // OPTIMIZATION: No DB write - Redis publisher handles real-time updates
    // Step data will be lazily persisted to DB when viewing execution history

    // Publish realtime event
    // For WAIT nodes with a delay, show "waiting" status until the delay completes
    const publishedStatus = (nodeType === NodeType.WAIT && delayForNextNode && delayForNextNode > 0)
      ? 'loading'  // Keep loading/waiting state
      : 'success';

    await publishWorkflowEvent(workflowId, executionId, {
      nodeId,
      nodeName,
      input: filterInternalFields(context) as any,
      output: filterInternalFields(nodeOutput) as any,
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

    // Update context with this node's result (flat structure, like n8n)
    const newContext = {
      ...context,
      [nodeName]: nodeOutput,
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
      delayForNextNode,
      dependencies,
      completedNodeIds
    );

    return {
      nodeId,
      nodeName,
      nodeType,
      output: cleanOutput,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Node execution failed";

    // RELIABILITY: Persist steps from Redis to DB on failure
    await persistExecutionSteps(executionId, workflowId);

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
    await publishWorkflowEvent(workflowId, executionId, {
      nodeId,
      nodeName,
      nodeType,
      type: 'node-status',
      status: 'error',
      error: errorMessage,
    });

    throw error;
  }
}

// ============================================================================
// Chain to Next Node (Dependency-Based for Branch Sequential Execution)
// ============================================================================

async function chainToNextNode(
  currentJobData: NodeJobData,
  newContext: Record<string, unknown>,
  newBranchDecisions: Record<string, BranchDecision>,
  newSkippedNodeIds: string[],
  delayMs?: number,
  dependencies?: Map<string, string[]>,
  completedNodeIds?: Set<string>
): Promise<void> {
  const { workflowId, executionId, nodeType, nodeId, nodeIndex, totalNodes, sortedNodeIds, workflowData } = currentJobData;

  // Reconstruct Map/Set if not passed (for skipped/visual-only nodes that call this before main execution)
  const depsMap = dependencies || new Map<string, string[]>(currentJobData.dependencies || []);
  const completed = completedNodeIds || new Set(currentJobData.completedNodeIds || []);

  // Add current node to completed set (if not already skipped)
  if (!newSkippedNodeIds.includes(nodeId)) {
    completed.add(nodeId);
  }

  // Find all nodes that are ready to execute (all dependencies satisfied)
  // We prioritize depth-first: execute children of the current branch first

  // OPTIMIZATION: Use passed workflowData instead of fetching from DB
  let workflow: SerializedWorkflow;
  if (workflowData) {
    workflow = workflowData;
  } else {
    const dbWorkflow = await prisma.workflow.findUniqueOrThrow({
      where: { id: workflowId },
      include: { nodes: true, connections: true }
    });
    workflow = {
      id: dbWorkflow.id,
      name: dbWorkflow.name,
      userId: dbWorkflow.userId,
      nodes: dbWorkflow.nodes.map(n => ({
        id: n.id,
        type: n.type,
        name: n.name,
        data: n.data as Record<string, unknown>,
      })),
      connections: dbWorkflow.connections.map(c => ({
        fromNodeId: c.fromNodeId,
        toNodeId: c.toNodeId,
        fromOutput: c.fromOutput,
        toInput: c.toInput,
      })),
    };
  }

  // Build adjacency list for finding children
  const children = new Map<string, string[]>();
  for (const conn of workflow.connections) {
    const siblings = children.get(conn.fromNodeId) || [];
    siblings.push(conn.toNodeId);
    children.set(conn.fromNodeId, siblings);
  }

  // Find ready nodes: not completed, not skipped, all dependencies satisfied
  const readyNodes: string[] = [];
  const currentChildren = children.get(nodeId) || [];

  // First, check direct children of current node (depth-first within branch)
  for (const childId of currentChildren) {
    if (completed.has(childId) || newSkippedNodeIds.includes(childId)) {
      continue;
    }
    const childDeps = depsMap.get(childId) || [];
    // Check if all dependencies are completed
    const allDepsComplete = childDeps.every(depId => completed.has(depId));
    if (allDepsComplete) {
      readyNodes.push(childId);
    }
  }

  // If no direct children are ready, check all remaining nodes
  if (readyNodes.length === 0) {
    for (const candidateId of sortedNodeIds) {
      if (completed.has(candidateId) || newSkippedNodeIds.includes(candidateId)) {
        continue;
      }
      const candidateDeps = depsMap.get(candidateId) || [];
      const allDepsComplete = candidateDeps.every(depId => completed.has(depId));
      if (allDepsComplete) {
        readyNodes.push(candidateId);
      }
    }
  }

  // Check if workflow is complete
  if (readyNodes.length === 0) {
    const cleanResult = filterInternalFields(newContext);

    // If this was a WAIT node with a delay, mark it as success now
    if (nodeType === NodeType.WAIT && delayMs && delayMs > 0) {
      await publishWorkflowEvent(workflowId, executionId, {
        nodeId,
        type: 'node-status',
        status: 'success',
        nodeType: NodeType.WAIT,
      });
    }

    // RELIABILITY: Persist steps from Redis to DB on completion
    await persistExecutionSteps(executionId, workflowId);

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

  // Pick the first ready node (depth-first priority)
  const nextNodeId = readyNodes[0];
  const nextNode = workflow.nodes.find(n => n.id === nextNodeId);

  if (!nextNode) {
    throw new Error(`Next node not found: ${nextNodeId}`);
  }

  // Calculate next node index for display purposes
  const nextIndex = sortedNodeIds.indexOf(nextNodeId);

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
      nodeData: nextNode.data,
      nodeIndex: nextIndex,
      totalNodes,
      context: newContext,
      branchDecisions: newBranchDecisions,
      skippedNodeIds: newSkippedNodeIds,
      sortedNodeIds,
      // Pass updated dependencies and completed set
      dependencies: Array.from(depsMap.entries()),
      completedNodeIds: Array.from(completed),
      // OPTIMIZATION: Pass workflow data to avoid repeated DB fetches
      workflowData: workflow,
      // Pass the WAIT node ID so we can mark it as success when this job starts
      previousWaitNodeId: (nodeType === NodeType.WAIT && delayMs && delayMs > 0) ? nodeId : undefined,
    } as NodeJobData,
    jobOptions
  );

  console.log(`[Node] Chained to next node: ${nextNode.name} (branch continuation)`);
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
