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

const CONTROL_NODE_TYPES: NodeType[] = [
  NodeType.IF_CONDITION,
  NodeType.SWITCH,
  NodeType.LOOP,
  NodeType.WAIT,
];

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
  connections: ConnectionWithBranch[],
  _allNodes: { id: string; type: NodeType }[],
  logger: { info: (obj: any, msg?: string) => void }
): Set<string> {
  const skippedNodes = new Set<string>();
  const outgoingConnections = connections.filter(c => c.fromNodeId === controlNodeId);

  logger.info({ connections: outgoingConnections.map(c => ({ to: c.toNodeId, output: c.fromOutput })) }, `[getSkippedNodes] Control node: ${controlNodeId} - Outgoing connections`);
  logger.info(`[getSkippedNodes] Branch decision: "${branchDecision.branch}"`);

  const nonTakenConnections = outgoingConnections.filter(
    c => c.fromOutput !== branchDecision.branch
  );

  logger.info({ connections: nonTakenConnections.map(c => ({ to: c.toNodeId, output: c.fromOutput })) }, `[getSkippedNodes] Non-taken connections`);

  for (const conn of nonTakenConnections) {
    const reachableFromNonTaken = findReachableNodes(conn.toNodeId, connections);
    logger.info({ reachable: Array.from(reachableFromNonTaken) }, `[getSkippedNodes] Reachable from non-taken (${conn.fromOutput})`);

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

    for (const nodeId of reachableFromNonTaken) {
      if (!reachableFromTaken.has(nodeId)) {
        skippedNodes.add(nodeId);
      }
    }
  }

  logger.info({ skippedNodes: Array.from(skippedNodes) }, `[getSkippedNodes] Final skipped nodes`);

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

export interface WorkflowJobData {
  workflowId: string;
  executionId: string;
  userId?: string;
  initialData?: Record<string, unknown>;
}

export async function executeWorkflowJob(job: any) {
  const { workflowId, executionId, userId, initialData } = job.data as WorkflowJobData;
  const logger = {
    info: (obj: any, msg?: string) => {
      console.log(msg || 'log', obj);
    }
  };

  if (!workflowId) {
    throw new Error('Workflow ID is required');
  }

  const workflow = await prisma.workflow.findUniqueOrThrow({
    where: { id: workflowId },
    include: {
      nodes: true,
      connections: true,
    }
  });

  let context = initialData || {};
  const skippedNodes = new Set<string>();
  const branchDecisions: Record<string, BranchDecision> = {};

  const stepStub = {
    run: async (name: string, fn: () => Promise<any>) => {
      return await fn();
    },
    sleep: async (name: string, duration: number) => {
      throw new Error('step.sleep() not yet implemented in BullMQ - use delay jobs');
    },
    sleepUntil: async (name: string, date: Date) => {
      throw new Error('step.sleepUntil() not yet implemented in BullMQ - use delay jobs');
    },
  };

  try {
    for (const node of topologicalSortNodes(workflow.nodes, workflow.connections)) {
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
        nodes: workflow.nodes.map(n => ({
          id: n.id,
          type: n.type,
          data: n.data as Record<string, unknown>,
        })),
        workflowId,
        workflowName: workflow.name,
        executionId,
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
            throw new Error(`Credential not found: ${credentialId}. The credential may have been deleted.`);
          }
          throw error;
        }
      };

      const stepStartedAt = new Date();
      const stepRecord = await prisma.executionStep.create({
        data: {
          executionId,
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          status: "RUNNING",
          startedAt: stepStartedAt,
          input: filterInternalFields(inputData) as any,
        }
      });

      try {
        const publish = async (payload: any) => {
          await publishWorkflowEvent(workflowId, payload);
        };

        context = await executor({
          data: resolvedData,
          nodeId: node.id,
          context,
          expressionContext,
          publish,
          resolveCredential,
          step: stepStub as any,
        });

        const cleanOutput = filterInternalFields(context);

        await prisma.executionStep.update({
          where: { id: stepRecord.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            output: cleanOutput as any,
          }
        });

        await publishWorkflowEvent(workflowId, {
          nodeId: node.id,
          input: filterInternalFields(inputData) as any,
          output: cleanOutput as any,
          nodeType: node.type,
        });
      } catch (error) {
        const stepErrorMessage = error instanceof Error ? error.message : "Step failed";

        await prisma.executionStep.update({
          where: { id: stepRecord.id },
          data: {
            status: "FAILED",
            completedAt: new Date(),
            error: stepErrorMessage,
          }
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

          const loopBodyConnections = workflow.connections.filter(
            c => c.fromNodeId === node.id && c.fromOutput === "loop"
          );

          if (loopBodyConnections.length > 0 && loopData.items.length > 0) {
            const loopBodyNodeIds = new Set<string>();
            for (const conn of loopBodyConnections) {
              const reachable = findReachableNodes(conn.toNodeId, workflow.connections);
              reachable.forEach(id => loopBodyNodeIds.add(id));
            }

            const doneConnections = workflow.connections.filter(
              c => c.fromNodeId === node.id && c.fromOutput === "done"
            );
            const doneNodeIds = new Set<string>();
            for (const conn of doneConnections) {
              const reachable = findReachableNodes(conn.toNodeId, workflow.connections);
              reachable.forEach(id => doneNodeIds.add(id));
            }

            for (const doneId of doneNodeIds) {
              loopBodyNodeIds.delete(doneId);
            }

            const loopBodyNodes = topologicalSortNodes(workflow.nodes, workflow.connections).filter(n => loopBodyNodeIds.has(n.id));

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
                  nodes: workflow.nodes.map(n => ({
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

                const loopExecutor = getExecutor(loopBodyNode.type as NodeType);

                 const publish = async (payload: any) => {
                  await publishWorkflowEvent(workflowId, payload);
                };

                const executorResult = await loopExecutor({
                  data: resolvedLoopData,
                  nodeId: loopBodyNode.id,
                  context: iterationContext as any,
                  expressionContext: loopExpressionContext,
                  publish,
                  resolveCredential,
                  step: stepStub as any,
                });

                iterationContext = { ...iterationContext, ...executorResult };

                const cleanIterationOutput = filterInternalFields(iterationContext);

                await publishWorkflowEvent(workflowId, {
                  nodeId: loopBodyNode.id,
                  input: filterInternalFields({ $item: item, $index: index, $total: loopData.total }) as any,
                  output: cleanIterationOutput as any,
                  nodeType: loopBodyNode.type,
                  iteration: { index, total: loopData.total },
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

          const outgoingConns = workflow.connections.filter(c => c.fromNodeId === node.id);
          logger.info({ connections: outgoingConns.map(c => ({ to: c.toNodeId, output: c.fromOutput })) }, `Control node ${node.id} connections`);
          logger.info(`Branch decision: "${branchDecision.branch}"`);

          const nodesToSkip = getSkippedNodes(
            node.id,
            branchDecision,
            workflow.connections,
            workflow.nodes.map(n => ({ id: n.id, type: n.type as NodeType })),
            logger
          );

          nodesToSkip.forEach(nodeId => skippedNodes.add(nodeId));

          logger.info({ skippedNodes: Array.from(nodesToSkip) }, `Control node ${node.id} took branch "${branchDecision.branch}", skipping nodes`);
        }
      }
    }

    const cleanResult = filterInternalFields(context);

    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: ExecutionStatus.COMPLETED,
        completedAt: new Date(),
        result: cleanResult as any,
      }
    });

    return {
      workflowId,
      executionId,
      result: cleanResult,
      branchDecisions,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: ExecutionStatus.FAILED,
        completedAt: new Date(),
        error: errorMessage,
      }
    });

    throw error;
  }
}
