/**
 * AI Agent Experimental Node Types
 * Tool-using agent using AI SDK v6 with step.ai.wrap()
 */
import { z } from "zod";

export const customToolSchema = z.object({
  name: z.string().min(1, "Tool name is required"),
  description: z.string().min(1, "Tool description is required"),
  // JSON Schema for parameters
  parametersSchema: z.string().default("{}"),
  // HTTP endpoint for tool execution
  endpoint: z.string().url().optional(),
});

export const aiAgentExpSettingsSchema = z.object({
  name: z.string().default("AI Agent"),
  model: z.string().default("gpt-4o"),
  credentialId: z.string().optional(),
  systemPrompt: z.string().default("You are a helpful assistant that can use tools to accomplish tasks."),
  prompt: z.string().default(""),
  inputVariable: z.string().optional(),
  // Max steps for the agent loop
  maxSteps: z.number().min(1).max(50).default(10),
  // Built-in tools
  enabledTools: z.array(z.enum(["http", "calculator", "code"])).default([]),
  // Custom tools
  customTools: z.array(customToolSchema).default([]),
  // Output format
  outputFormat: z.enum(["text", "json"]).default("text"),
  temperature: z.number().min(0).max(2).default(0.7),
});

export type CustomTool = z.infer<typeof customToolSchema>;
export type AIAgentExpSettings = z.infer<typeof aiAgentExpSettingsSchema>;
