import { generateText } from "ai";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { google } from "@ai-sdk/google";
import { NonRetriableError } from "inngest";
import { topologicalSortNodes } from "@/features/editor/utils/graph-validation";
import { NodeType } from "@/features/nodes/types";
import { getExecutor } from "@/features/nodes/utils/execution/executors-registry";
import {
  resolveNodeExpressions,
  buildExpressionContext
} from "@/features/editor/utils/resolve-expressions";
import { workflowNodeChannel } from "@/features/nodes/utils/realtime";
import type { BranchDecision } from "@/features/nodes/utils/execution/types";
import { getCredentialForExecution, CredentialNotFoundError } from "@/lib/credentials/execution";
import { ExecutionStatus } from "@/lib/generated/prisma/client";

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
  _allNodes: { id: string; type: NodeType }[],
  logger: { info: (obj: any, msg?: string) => void }
): Set<string> {
  const skippedNodes = new Set<string>();

  // Find all connections from this control node
  const outgoingConnections = connections.filter(c => c.fromNodeId === controlNodeId);

  logger.info(`[getSkippedNodes] Control node: ${controlNodeId}`);
  logger.info(`[getSkippedNodes] Branch decision: "${branchDecision.branch}"`);
  logger.info({ connections: outgoingConnections.map(c => ({ to: c.toNodeId, output: c.fromOutput })) }, `[getSkippedNodes] Control node: ${controlNodeId} - Outgoing connections`);

  // Find connections that are NOT on the taken branch
  const nonTakenConnections = outgoingConnections.filter(
    c => c.fromOutput !== branchDecision.branch
  );

  logger.info({ connections: nonTakenConnections.map(c => ({ to: c.toNodeId, output: c.fromOutput })) }, `[getSkippedNodes] Non-taken connections`);

  // For each non-taken connection, find all nodes reachable only through that path
  for (const conn of nonTakenConnections) {
    const reachableFromNonTaken = findReachableNodes(conn.toNodeId, connections);

    logger.info({ reachable: Array.from(reachableFromNonTaken) }, `[getSkippedNodes] Reachable from non-taken (${conn.fromOutput})`);

    // Check if each reachable node is also reachable from the taken branch
    const takenConnections = outgoingConnections.filter(
      c => c.fromOutput === branchDecision.branch
    );

    logger.info({ connections: takenConnections.map(c => ({ to: c.toNodeId, output: c.fromOutput })) }, `[getSkippedNodes] Taken connections`);

    const reachableFromTaken = new Set<string>();
    for (const takenConn of takenConnections) {
      const reachable = findReachableNodes(takenConn.toNodeId, connections);
      reachable.forEach(nodeId => reachableFromTaken.add(nodeId));
    }

    logger.info({ reachable: Array.from(reachableFromTaken) }, `[getSkippedNodes] Reachable from taken`);

    // Skip nodes that are only reachable from non-taken branches
    for (const nodeId of reachableFromNonTaken) {
      if (!reachableFromTaken.has(nodeId)) {
        skippedNodes.add(nodeId);
      }
    }
  }

  logger.info({ skippedNodes: Array.from(skippedNodes) }, `[getSkippedNodes] Final skipped nodes`);

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
  async ({ event, step, publish, logger: inngestLogger }) => {
    const logger = {
      info: (obj: any, msg?: string) => {
        if (typeof obj === 'string') {
          inngestLogger.info(obj);
        } else {
          inngestLogger.info(msg || 'log', obj);
        }
      }
    };

    const workflowId = event.data.workflowId;
    const inngestRunId = event.id;
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    if (!workflowId) {
      throw new NonRetriableError("Workflow ID is required");
    }

    const workflowData = await step.run("get-workflow-and-create-execution", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: workflowId,
        },
        include: {
          nodes: true,
          connections: true,
        }
      });

      const execution = await prisma.execution.create({
        data: {
          workflowId,
          userId: workflow.userId,
          status: ExecutionStatus.RUNNING,
          inngestRunId,
        }
      });

      return {
        executionId: execution.id,
        userId: workflow.userId,
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

    const skippedNodes = new Set<string>();
    const branchDecisions: Record<string, BranchDecision> = {};

    try {
      for (const node of workflowData.sortedNodes) {
        logger.info({ skippedNodes: Array.from(skippedNodes) }, `[execute] Processing node ${node.id} (${node.type})`);

        if (skippedNodes.has(node.id)) {
          logger.info(`[execute] Skipping node ${node.id} - not on active branch`);
          continue;
        }

        logger.info(`[execute] Executing node ${node.id}`);

        const inputData = { ...context };

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
          executionId: inngestRunId ?? executionId,
          currentNodeId: node.id,
        });

        const resolvedData = await resolveNodeExpressions(
          node.data as Record<string, unknown>,
          expressionContext
        );

        const executor = getExecutor(node.type as NodeType);

        const resolveCredential = async (credentialId: string) => {
          try {
            return await getCredentialForExecution(credentialId, workflowId);
          } catch (error) {
            if (error instanceof CredentialNotFoundError) {
              throw new NonRetriableError(`Credential not found: ${credentialId}. The credential may have been deleted.`);
            }
            throw error;
          }
        };

        const stepStartedAt = new Date();
        const stepRecord = await step.run(`create-step-record:${node.id}`, async () => {
          return prisma.executionStep.create({
            data: {
              executionId: workflowData.executionId,
              nodeId: node.id,
              nodeName: node.name,
              nodeType: node.type,
              status: "RUNNING",
              startedAt: stepStartedAt,
              input: filterInternalFields(inputData) as any,

            }
          });
        });

        try {
          context = await executor({
            data: resolvedData,
            nodeId: node.id,
            context,
            step,
            expressionContext,
            publish,
            resolveCredential,
          });

          const cleanOutput = filterInternalFields(context);

          await step.run(`update-step-success:${node.id}`, async () => {
            await prisma.executionStep.update({
              where: { id: stepRecord.id },
              data: {
                status: "COMPLETED",
                completedAt: new Date(),
                output: cleanOutput as any,
              }
            });
          });

          await step.run(`publish-data:${node.id}`, async () => {
            await publish(workflowNodeChannel().data({
              nodeId: node.id,
              input: filterInternalFields(inputData) as any,
              output: cleanOutput as any,
              nodeType: node.type,
            }));
          });
        } catch (error) {
          const stepErrorMessage = error instanceof Error ? error.message : "Step failed";
          await step.run(`update-step-failed:${node.id}`, async () => {
            await prisma.executionStep.update({
              where: { id: stepRecord.id },
              data: {
                status: "FAILED",
                completedAt: new Date(),
                error: stepErrorMessage,
              }
            });
          });
          throw error;
        }

        if (isControlNode(node.type as NodeType) && context.__branchDecision) {
          const branchDecision = context.__branchDecision as BranchDecision;
          branchDecisions[node.id] = branchDecision;

          if (node.type === NodeType.LOOP && context.__loopNode) {
            const loopData = context.__loopNode as {
              nodeId: string;
              nodeName: string;
              items: unknown[];
              total: number;
              mode: string;
              currentIndex: number;
              results: unknown[];
            };

            const loopBodyConnections = workflowData.connections.filter(
              c => c.fromNodeId === node.id && c.fromOutput === "loop"
            );

            if (loopBodyConnections.length > 0 && loopData.items.length > 0) {
              const loopBodyNodeIds = new Set<string>();
              for (const conn of loopBodyConnections) {
                const reachable = findReachableNodes(conn.toNodeId, workflowData.connections);
                reachable.forEach(id => loopBodyNodeIds.add(id));
              }

              const doneConnections = workflowData.connections.filter(
                c => c.fromNodeId === node.id && c.fromOutput === "done"
              );
              const doneNodeIds = new Set<string>();
              for (const conn of doneConnections) {
                const reachable = findReachableNodes(conn.toNodeId, workflowData.connections);
                reachable.forEach(id => doneNodeIds.add(id));
              }

              for (const doneId of doneNodeIds) {
                loopBodyNodeIds.delete(doneId);
              }

              const loopBodyNodes = workflowData.sortedNodes.filter(n => loopBodyNodeIds.has(n.id));

              logger.info({ loopBodyNodes: loopBodyNodes.map(n => n.id) }, `Loop node ${node.id}: Executing loop body nodes`);

              const iterationResults: unknown[] = [];

              for (let index = 0; index < loopData.items.length; index++) {
                const item = loopData.items[index];

                logger.info(`Loop iteration ${index + 1}/${loopData.total}`);

                let iterationContext = {
                  ...context,
                  [`${loopData.nodeName}`]: {
                    ...((context[loopData.nodeName] as Record<string, unknown>) || {}),
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
                    nodeResults: {
                      ...iterationContext,
                      __branchDecisions: branchDecisions,
                    },
                    nodes: workflowData.nodes.map(n => ({
                      id: n.id,
                      type: n.type,
                      data: n.data as Record<string, unknown>,
                    })),
                    workflowId,
                    workflowName: workflowData.name,
                    executionId: inngestRunId ?? executionId,
                    currentNodeId: loopBodyNode.id,
                  });

                  const resolvedLoopData = await resolveNodeExpressions(
                    loopBodyNode.data as Record<string, unknown>,
                    loopExpressionContext
                  );

                  const loopExecutor = getExecutor(loopBodyNode.type as NodeType);
                  iterationContext = await loopExecutor({
                    data: resolvedLoopData,
                    nodeId: loopBodyNode.id,
                    context: iterationContext,
                    step,
                    expressionContext: loopExpressionContext,
                    publish,
                    resolveCredential,
                  });

                  const cleanIterationOutput = filterInternalFields(iterationContext);
                  await step.run(`publish-loop-data:${loopBodyNode.id}:${index}`, async () => {
                    await publish(workflowNodeChannel().data({
                      nodeId: loopBodyNode.id,
                      input: filterInternalFields({ $item: item, $index: index, $total: loopData.total }) as any,
                      output: cleanIterationOutput as any,
                      nodeType: loopBodyNode.type,
                      iteration: { index, total: loopData.total },
                    }));
                  });
                }

                iterationResults.push({
                  item,
                  index,
                  result: filterInternalFields(iterationContext),
                });
              }

              context = {
                ...context,
                [`${loopData.nodeName}`]: {
                  items: loopData.items,
                  total: loopData.total,
                  mode: loopData.mode,
                  results: iterationResults,
                  $item: loopData.items[loopData.items.length - 1],
                  $index: loopData.items.length - 1,
                  $total: loopData.total,
                },
                __loopResults: iterationResults,
              };

              loopBodyNodeIds.forEach(id => skippedNodes.add(id));

              const doneBranchDecision: BranchDecision = {
                branch: "done",
                data: {
                  results: iterationResults,
                  total: loopData.total,
                  mode: loopData.mode,
                },
              };
              branchDecisions[node.id] = doneBranchDecision;
              context = {
                ...context,
                __branchDecision: doneBranchDecision,
                __lastBranchDecision: doneBranchDecision,
                __branchDecisions: branchDecisions,
              };

              logger.info({ results: iterationResults.length }, `Loop node ${node.id}: Completed all iterations`);
            }
          } else {
            context = {
              ...context,
              __lastBranchDecision: branchDecision,
              __branchDecisions: branchDecisions,
            };

            const outgoingConns = workflowData.connections.filter(c => c.fromNodeId === node.id);
            logger.info({ connections: outgoingConns.map(c => ({ to: c.toNodeId, output: c.fromOutput })) }, `Control node ${node.id} connections`);
            logger.info(`Branch decision: "${branchDecision.branch}"`);

            const nodesToSkip = getSkippedNodes(
              node.id,
              branchDecision,
              workflowData.connections,
              workflowData.nodes.map(n => ({ id: n.id, type: n.type as NodeType })),
              logger
            );

            nodesToSkip.forEach(nodeId => skippedNodes.add(nodeId));

            logger.info({ skippedNodes: Array.from(nodesToSkip) }, `Control node ${node.id} took branch "${branchDecision.branch}", skipping nodes`);
          }
        }
      }

      const cleanResult = filterInternalFields(context);

      await step.run("mark-execution-completed", async () => {
        await prisma.execution.update({
          where: { id: workflowData.executionId },
          data: {
            status: ExecutionStatus.COMPLETED,
            completedAt: new Date(),
            result: cleanResult as any,
          }
        });
      });

      return {
        workflowId,
        executionId: workflowData.executionId,
        result: cleanResult,
        branchDecisions,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      await step.run("mark-execution-failed", async () => {
        await prisma.execution.update({
          where: { id: workflowData.executionId },
          data: {
            status: ExecutionStatus.FAILED,
            completedAt: new Date(),
            error: errorMessage,
          }
        });
      });

      throw error;
    }
  },
)