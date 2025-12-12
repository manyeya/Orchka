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
  { event: "workflow/execute" },
  async ({ event, step }) => {
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
        sortedNodes: topologicalSortNodes(workflow.nodes, workflow.connections),
      };
    });

    let context = event.data.initialData || {};

    for (const node of workflowData.sortedNodes) {
      // Build expression context from accumulated results
      const expressionContext = buildExpressionContext({
        nodeResults: context,
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
      const resolvedData = resolveNodeExpressions(
        node.data as Record<string, unknown>,
        expressionContext
      );

      const executor = getExecutor(node.type as NodeType);
      context = await executor({
        data: resolvedData,
        nodeId: node.id,
        context,
        step,
        expressionContext
      })
    }

    return {
      workflowId,
      result: context
    }

  },
)