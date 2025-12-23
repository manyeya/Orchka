import { NonRetriableError } from "inngest";
import { NodeExecutor, WorkflowContext } from "../../utils/execution/types";
import { AIAgentSettings } from "./types";
import { publishNodeStatus } from "../../utils/realtime";
import { NodeType } from "@/features/nodes/types";
import { createAgent, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq, } from "@langchain/groq";
import { DynamicStructuredTool } from "@langchain/core/tools";
import * as z from "zod";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * AI Agent Executor using LangChain createReactAgent
 * Similar to n8n's AI Agent node
 */
export const aiAgentExecutor: NodeExecutor<AIAgentSettings> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}): Promise<WorkflowContext> => {
  await publishNodeStatus(publish, nodeId, "loading", NodeType.AI_AGENT);

  const nodeName = data.name || "AI Agent";
  const stepName = `${nodeName} (${nodeId})`;

  const result = await step.run(stepName, async () => {
    // 1. Initialize the model based on model string
    const model = createModel(data.model);

    // 2. Build tools
    const tools = buildTools(data, context);

    // 3. Create the agent using LangChain's createReactAgent
    const agent = createAgent({
      model,
      tools,
      systemPrompt: data.systemPrompt,
    });

    // 4. Get input - use prompt directly, or resolve from context
    let input: unknown;

    if (data.prompt && data.prompt.trim()) {
      // Use direct prompt
      input = data.prompt;
    } else if (data.inputVariable && data.inputVariable.trim()) {
      // Resolve from workflow context
      input = resolveInput(data.inputVariable, context);
      if (!input) {
        throw new NonRetriableError(
          `Input variable "${data.inputVariable}" not found in context`
        );
      }
    } else {
      throw new NonRetriableError(
        "No prompt or input variable configured for AI Agent"
      );
    }

    // 5. Execute the agent
    const response = await agent.invoke({
      messages: [{ role: "user", content: String(input) }],
    });

    // 6. Extract the final response
    const messages = response.messages;
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage?.content || "";

    // 7. Parse output if JSON format requested
    let output: unknown = content;
    if (data.outputFormat === "json" && typeof content === "string") {
      try {
        output = JSON.parse(content);
      } catch {
        output = content;
      }
    }

    return {
      content: output,
      raw: content,
      messageCount: messages.length,
      toolCalls: messages
        .filter((m: any) => m.tool_calls?.length)
        .flatMap((m: any) => m.tool_calls),
    };
  });

  await publishNodeStatus(publish, nodeId, "success", NodeType.AI_AGENT);

  return {
    ...context,
    [nodeName]: result,
  };
};

/**
 * Create the appropriate chat model based on model string
 */
function createModel(modelString: string): BaseChatModel {
  // OpenAI models (gpt-*, o1, o3)
  if (
    modelString.startsWith("gpt-") ||
    modelString.startsWith("o1") ||
    modelString.startsWith("o3")
  ) {
    return new ChatOpenAI({
      model: modelString,
      temperature: 0.7,
    });
  }

  // Anthropic models
  if (modelString.startsWith("claude-")) {
    return new ChatAnthropic({
      model: modelString,
      temperature: 0.7,
    });
  }

  // Google models
  if (modelString.startsWith("gemini-")) {
    return new ChatGoogleGenerativeAI({
      model: modelString,
      temperature: 0.7,
    });
  }

  // Groq models (llama, mixtral, gemma)
  if (
    modelString.startsWith("llama-") ||
    modelString.startsWith("mixtral-") ||
    modelString.startsWith("gemma")
  ) {
    return new ChatGroq({
      model: modelString,
      temperature: 0.7,
    });
  }

  // Default to OpenAI
  return new ChatOpenAI({
    model: modelString,
    temperature: 0.7,
  });
}

/**
 * Build tools based on configuration
 */
function buildTools(data: AIAgentSettings, _context: WorkflowContext) {
  const tools: DynamicStructuredTool[] = [];

  // HTTP Request tool
  if (data.enabledTools.includes("http")) {
    const httpTool = new DynamicStructuredTool({
      name: "http_request",
      description:
        "Make HTTP requests to external APIs. Use this to fetch data from URLs or call external services.",
      schema: z.object({
        url: z.string().describe("The URL to request"),
        method: z
          .enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
          .default("GET")
          .describe("HTTP method"),
        body: z.string().optional().describe("Request body as JSON string"),
        headers: z.string().optional().describe("Headers as JSON string"),
      }),
      func: async ({ url, method, body, headers }) => {
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
    tools.push(httpTool);
  }

  // Code execution tool
  if (data.enabledTools.includes("code")) {
    const codeTool = new DynamicStructuredTool({
      name: "evaluate_expression",
      description:
        "Evaluate a JavaScript expression and return the result. Useful for calculations and data transformations.",
      schema: z.object({
        expression: z
          .string()
          .describe("JavaScript expression to evaluate (e.g., '2 + 2', 'Math.sqrt(16)')"),
      }),
      func: async ({ expression }) => {
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
    tools.push(codeTool);
  }

  // Calculator tool
  if (data.enabledTools.includes("calculator")) {
    const calcTool = new DynamicStructuredTool({
      name: "calculator",
      description: "Perform basic mathematical operations",
      schema: z.object({
        operation: z
          .enum(["add", "subtract", "multiply", "divide", "power"])
          .describe("The operation to perform"),
        a: z.number().describe("First number"),
        b: z.number().describe("Second number"),
      }),
      func: async ({ operation, a, b }) => {
        let result: number;
        switch (operation) {
          case "add":
            result = a + b;
            break;
          case "subtract":
            result = a - b;
            break;
          case "multiply":
            result = a * b;
            break;
          case "divide":
            if (b === 0) return "Error: Division by zero";
            result = a / b;
            break;
          case "power":
            result = Math.pow(a, b);
            break;
          default:
            return "Error: Unknown operation";
        }
        return String(result);
      },
    });
    tools.push(calcTool);
  }

  // Custom tools
  if (data.customTools?.length) {
    for (const customTool of data.customTools) {
      try {
        const customDynamicTool = new DynamicStructuredTool({
          name: customTool.name,
          description: customTool.description,
          schema: z.object({
            input: z.string().describe("Input for the custom tool"),
          }),
          func: async ({ input }) => {
            if (customTool.endpoint) {
              try {
                const res = await fetch(customTool.endpoint, {
                  method: "POST",
                  body: JSON.stringify({ input }),
                  headers: { "Content-Type": "application/json" },
                });
                return await res.text();
              } catch (error) {
                return `Error: ${error instanceof Error ? error.message : "Request failed"}`;
              }
            }
            return input;
          },
        });
        tools.push(customDynamicTool);
      } catch {
        // Skip invalid custom tools
      }
    }
  }

  return tools;
}

/**
 * Resolve input from context
 */
function resolveInput(
  inputVariable: string,
  context: WorkflowContext
): unknown {
  // Try direct access
  if (context[inputVariable] !== undefined) {
    return context[inputVariable];
  }

  // Try nested access (e.g., "HTTP Request.data")
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
