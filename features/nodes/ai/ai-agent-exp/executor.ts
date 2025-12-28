/**
 * AI Agent Experimental Executor
 * Uses AI SDK generateText with tools for durable agent execution
 */
import { generateText, tool, stepCountIs } from "ai";
import { NonRetriableError } from "inngest";
import { z } from "zod";
import type { NodeExecutor, WorkflowContext } from "../../utils/execution/types";
import type { AIAgentExpSettings } from "./types";
import { publishNodeStatus } from "../../utils/realtime";
import { NodeType } from "@/features/nodes/types";
import {
  createAIModelAsync,
  extractAICredentialConfig,
} from "../shared/model-factory";

export const aiAgentExpExecutor: NodeExecutor<AIAgentExpSettings> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
  resolveCredential,
}): Promise<WorkflowContext> => {
  await publishNodeStatus(
    publish,
    nodeId,
    "loading",
    NodeType.AI_AGENT_EXP,
    undefined,
    step
  );

  const nodeName = data.name || "AI Agent";
  const stepName = `${nodeName} (${nodeId})`;

  try {
    let credentialConfig = null;
    if (data.credentialId && resolveCredential) {
      const credential = await resolveCredential(data.credentialId);
      credentialConfig = extractAICredentialConfig(credential, data.model);
    }

    let input: string;
    if (data.prompt && data.prompt.trim()) {
      input = data.prompt;
    } else if (data.inputVariable && data.inputVariable.trim()) {
      const resolved = resolveInput(data.inputVariable, context);
      if (!resolved) {
        throw new NonRetriableError(
          `Input variable "${data.inputVariable}" not found`
        );
      }
      input =
        typeof resolved === "string" ? resolved : JSON.stringify(resolved);
    } else {
      throw new NonRetriableError("No prompt or input variable configured");
    }

    // Execute AI agent within a step for durability
    const result = await step.run(stepName, async () => {
      const model = await createAIModelAsync(data.model, credentialConfig);

      // Build tools object - use any to avoid complex type inference issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tools: Record<string, any> = {};

      if (data.enabledTools.includes("http")) {
        tools.httpRequest = tool({
          description: "Make HTTP requests to external APIs.",
          inputSchema: z.object({
            url: z.string().describe("The URL to request"),
            method: z
              .enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
              .default("GET")
              .describe("HTTP method"),
            body: z.string().optional().describe("Request body as JSON string"),
            headers: z.string().optional().describe("Headers as JSON string"),
          }),
          execute: async ({ url, method, body, headers }) => {
            try {
              const parsedHeaders = headers ? JSON.parse(headers) : {};
              const res = await fetch(url, {
                method: method || "GET",
                body: body || undefined,
                headers: {
                  "Content-Type": "application/json",
                  ...parsedHeaders,
                },
              });
              const text = await res.text();
              try {
                return JSON.stringify(JSON.parse(text), null, 2);
              } catch {
                return text;
              }
            } catch (error) {
              return `Error: ${error instanceof Error ? error.message : "Request failed"}`;
            }
          },
        });
      }

      if (data.enabledTools.includes("calculator")) {
        tools.calculator = tool({
          description: "Perform mathematical calculations",
          inputSchema: z.object({
            operation: z
              .enum([
                "add",
                "subtract",
                "multiply",
                "divide",
                "power",
                "sqrt",
                "percentage",
              ])
              .describe("The operation to perform"),
            a: z.number().describe("First number"),
            b: z
              .number()
              .optional()
              .describe("Second number (not needed for sqrt)"),
          }),
          execute: async ({ operation, a, b }) => {
            let result: number;
            switch (operation) {
              case "add":
                result = a + (b ?? 0);
                break;
              case "subtract":
                result = a - (b ?? 0);
                break;
              case "multiply":
                result = a * (b ?? 1);
                break;
              case "divide":
                if (b === 0) return "Error: Division by zero";
                result = a / (b ?? 1);
                break;
              case "power":
                result = Math.pow(a, b ?? 2);
                break;
              case "sqrt":
                result = Math.sqrt(a);
                break;
              case "percentage":
                result = (a / 100) * (b ?? 100);
                break;
              default:
                return "Error: Unknown operation";
            }
            return String(result);
          },
        });
      }

      if (data.enabledTools.includes("code")) {
        tools.evaluateExpression = tool({
          description: "Evaluate a JavaScript expression.",
          inputSchema: z.object({
            expression: z
              .string()
              .describe("JavaScript expression to evaluate"),
          }),
          execute: async ({ expression }) => {
            try {
              const fn = new Function(`return ${expression}`);
              const result = fn();
              return typeof result === "object"
                ? JSON.stringify(result, null, 2)
                : String(result);
            } catch (error) {
              return `Error: ${error instanceof Error ? error.message : "Evaluation failed"}`;
            }
          },
        });
      }

      const response = await generateText({
        model,
        system: data.systemPrompt,
        prompt: input,
        tools,
        stopWhen: stepCountIs(data.maxSteps || 10),
        temperature: data.temperature,
      });

      return {
        text: response.text,
        toolCalls: response.toolCalls || [],
        steps: response.steps?.length || 0,
        usage: response.usage,
        finishReason: response.finishReason,
      };
    });

    let output: unknown = result.text;
    if (data.outputFormat === "json" && typeof result.text === "string") {
      try {
        output = JSON.parse(result.text);
      } catch {
        output = result.text;
      }
    }

    await publishNodeStatus(
      publish,
      nodeId,
      "success",
      NodeType.AI_AGENT_EXP,
      undefined,
      step
    );

    return {
      ...context,
      [nodeName]: {
        text: output,
        raw: result.text,
        toolCalls: result.toolCalls,
        steps: result.steps,
        usage: result.usage,
        finishReason: result.finishReason,
      },
    };
  } catch (error) {
    await publishNodeStatus(
      publish,
      nodeId,
      "error",
      NodeType.AI_AGENT_EXP,
      undefined,
      step
    );
    throw error;
  }
};

function resolveInput(
  inputVariable: string,
  context: WorkflowContext
): unknown {
  if (context[inputVariable] !== undefined) {
    return context[inputVariable];
  }
  const parts = inputVariable.split(".");
  let value: unknown = context;
  for (const part of parts) {
    if (value && typeof value === "object" && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return value;
}
