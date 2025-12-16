import { generateText } from "ai";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { google } from "@ai-sdk/google";
import { NonRetriableError } from "inngest";
import { topologicalSortNodes } from "@/features/editor/utils/graph-validation";
import { NodeType } from "@/lib/generated/prisma/enums";
import { getExecutor } from "@/features/nodes/utils/execution/executors-registry";
import {
  resolveNodeExpressions,
  buildExpressionContext
} from "@/features/editor/utils/resolve-expressions";
import { workflowNodeChannel } from "@/features/nodes/utils/realtime";
import type { BranchDecision } from "@/features/nodes/utils/execution/types";

/** Control node types that can produce branch decisions */
const CONTROL_NODE_TYPES: NodeType[] = [
  NodeType.IF_CONDITION,
  NodeType.SWITCH,
  NodeType.LOOP,
  NodeType.WAIT,
];

/**
 * Filters out internal fields (prefixed with __) from context
 * These are used internally for branch tracking and shouldn't be exposed to users
 */
function filterInternalFields(context: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (!key.startsWith('__')) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Checks if a node type is a control node that produces branch decisions
 */
function isControlNode(nodeType: NodeType): boolean {
  return CONTROL_NODE_TYPES.includes(nodeType);
}

/**
 * Represents a connection with branch information
 */
interface ConnectionWithBranch {
  fromNodeId: string;
  toNodeId: string;
  fromOutput: string;
  toInput: string;
}

/**
 * Determines which nodes should be skipped based on branch decisions.
 * 
 * When a control node executes and returns a branch decision, only nodes
 * connected to the taken branch should execute. Nodes only reachable through
 * non-taken branches should be skipped.
 * 
 * Requirements:
 * - 5.1: Determine which output handle(s) to follow based on execution result
 * - 5.2: Skip all nodes only reachable through non-taken branches
 * - 5.3: Execute convergence nodes only after all active incoming branches complete
 */
function getSkippedNodes(
  controlNodeId: string,
  branchDecision: BranchDecision,
  connections: ConnectionWithBranch[],
  _allNodes: { id: string; type: NodeType }[]
): Set<string> {
  const skippedNodes = new Set<string>();
  
  // Find all connections from this control node
  const outgoingConnections = connections.filter(c => c.fromNodeId === controlNodeId);
  
  console.log(`[getSkippedNodes] Control node: ${controlNodeId}`);
  console.log(`[getSkippedNodes] Branch decision: "${branchDecision.branch}"`);
  console.log(`[getSkippedNodes] Outgoing connections:`, outgoingConnections.map(c => ({ to: c.toNodeId, output: c.fromOutput })));
  
  // Find connections that are NOT on the taken branch
  const nonTakenConnections = outgoingConnections.filter(
    c => c.fromOutput !== branchDecision.branch
  );
  
  console.log(`[getSkippedNodes] Non-taken connections:`, nonTakenConnections.map(c => ({ to: c.toNodeId, output: c.fromOutput })));
  
  // For each non-taken connection, find all nodes reachable only through that path
  for (const conn of nonTakenConnections) {
    const reachableFromNonTaken = findReachableNodes(conn.toNodeId, connections);
    
    console.log(`[getSkippedNodes] Reachable from non-taken (${conn.fromOutput}):`, Array.from(reachableFromNonTaken));
    
    // Check if each reachable node is also reachable from the taken branch
    const takenConnections = outgoingConnections.filter(
      c => c.fromOutput === branchDecision.branch
    );
    
    console.log(`[getSkippedNodes] Taken connections:`, takenConnections.map(c => ({ to: c.toNodeId, output: c.fromOutput })));
    
    const reachableFromTaken = new Set<string>();
    for (const takenConn of takenConnections) {
      const reachable = findReachableNodes(takenConn.toNodeId, connections);
      reachable.forEach(nodeId => reachableFromTaken.add(nodeId));
    }
    
    console.log(`[getSkippedNodes] Reachable from taken:`, Array.from(reachableFromTaken));
    
    // Skip nodes that are only reachable from non-taken branches
    for (const nodeId of reachableFromNonTaken) {
      if (!reachableFromTaken.has(nodeId)) {
        skippedNodes.add(nodeId);
      }
    }
  }
  
  console.log(`[getSkippedNodes] Final skipped nodes:`, Array.from(skippedNodes));
  
  return skippedNodes;
}

/**
 * Finds all nodes reachable from a starting node by following connections
 */
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
    
    // Find all nodes connected from this node
    const outgoing = connections.filter(c => c.fromNodeId === current);
    for (const conn of outgoing) {
      if (!reachable.has(conn.toNodeId)) {
        queue.push(conn.toNodeId);
      }
    }
  }
  
  return reachable;
}

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step, }) => {
    await step.sleep("wait-a-moment", "15s");

    await step.run("send-email", async () => {
      return prisma.workflow.create({
        data: {
          name: "New Workflow - " + event.data.email,
          userId: event.data.userId,
        }
      })
    });

    await step.ai.wrap('gemini-generate-text', generateText, {
      model: google('gemini-2.5-flash'),
      system: "You are a helpful assistant",
      prompt: "write a recipe for a pizza for 4 people",
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: true,
        recordOutputs: true,
      },
    })

    return { message: `Hello ${event.data.email}!` };
  },
);

export const execute = inngest.createFunction(
  { id: "execute-workflow" },
  { event: "workflow/execute", channels: [workflowNodeChannel] },
  async ({ event, step, publish }) => {
    const workflowId = event.data.workflowId;

    if (!workflowId) {
      throw new NonRetriableError("Workflow ID is required");
    }

    const workflowData = await step.run("get-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: workflowId,
        },
        include: {
          nodes: true,
          connections: true,
        }
      });

      return {
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections.map(c => ({
          fromNodeId: c.fromNodeId,
          toNodeId: c.toNodeId,
          fromOutput: c.fromOutput,
          toInput: c.toInput,
        })),
        sortedNodes: topologicalSortNodes(workflow.nodes, workflow.connections),
      };
    });

    let context = event.data.initialData || {};
    
    // Track nodes to skip due to branch decisions
    // Requirements 5.2: Skip all nodes only reachable through non-taken branches
    const skippedNodes = new Set<string>();
    
    // Track branch decisions for context propagation
    // Requirements 5.5: Include selected branch identifier in execution context
    const branchDecisions: Record<string, BranchDecision> = {};

    for (const node of workflowData.sortedNodes) {
      console.log(`[execute] Processing node ${node.id} (${node.type}), skippedNodes:`, Array.from(skippedNodes));
      
      // Skip nodes that are only reachable through non-taken branches
      if (skippedNodes.has(node.id)) {
        console.log(`[execute] Skipping node ${node.id} - not on active branch`);
        continue;
      }
      
      console.log(`[execute] Executing node ${node.id}`);
      
      // Capture current context as this node's input
      const inputData = { ...context };

      // Build expression context from accumulated results
      // Include branch decisions in the context for downstream nodes
      const expressionContext = buildExpressionContext({
        nodeResults: {
          ...context,
          __branchDecisions: branchDecisions,
        },
        nodes: workflowData.nodes.map(n => ({
          id: n.id,
          type: n.type,
          data: n.data as Record<string, unknown>,
        })),
        workflowId,
        workflowName: workflowData.name,
        executionId: event.id ?? `exec_${Date.now()}`,
      });

      // Resolve all {{ }} expressions in node configuration
      const resolvedData = await resolveNodeExpressions(
        node.data as Record<string, unknown>,
        expressionContext
      );

      const executor = getExecutor(node.type as NodeType);
      context = await executor({
        data: resolvedData,
        nodeId: node.id,
        context,
        step,
        expressionContext,
        publish,
      });

      // Handle branch decisions from control nodes
      // Requirements 5.1: Determine which output handle(s) to follow
      if (isControlNode(node.type as NodeType) && context.__branchDecision) {
        const branchDecision = context.__branchDecision as BranchDecision;
        
        // Store branch decision for context propagation (Requirement 5.5)
        branchDecisions[node.id] = branchDecision;
        
        // Add branch decision to context for downstream nodes
        context = {
          ...context,
          __lastBranchDecision: branchDecision,
          __branchDecisions: branchDecisions,
        };
        
        // Debug: log connections from this control node
        const outgoingConns = workflowData.connections.filter(c => c.fromNodeId === node.id);
        console.log(`Control node ${node.id} connections:`, outgoingConns.map(c => ({ to: c.toNodeId, output: c.fromOutput })));
        console.log(`Branch decision: "${branchDecision.branch}"`);
        
        // Determine which nodes to skip based on branch decision
        // Requirements 5.2: Skip nodes only reachable through non-taken branches
        const nodesToSkip = getSkippedNodes(
          node.id,
          branchDecision,
          workflowData.connections,
          workflowData.nodes.map(n => ({ id: n.id, type: n.type as NodeType }))
        );
        
        nodesToSkip.forEach(nodeId => skippedNodes.add(nodeId));
        
        console.log(`Control node ${node.id} took branch "${branchDecision.branch}", skipping nodes:`, Array.from(nodesToSkip));
      }

      // Filter out internal fields (prefixed with __) for client display
      const cleanOutput = filterInternalFields(context);
      const cleanInput = filterInternalFields(inputData);

      // Publish node data for client display (input/output panels)
      await publish(workflowNodeChannel().data({
        nodeId: node.id,
        input: cleanInput,
        output: cleanOutput,
        nodeType: node.type,
      }));
    }

    // Filter out internal fields from final result
    const cleanResult = filterInternalFields(context);

    return {
      workflowId,
      result: cleanResult,
      branchDecisions,
    };
  },
)