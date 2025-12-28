import * as z from "zod";

export const customToolSchema = z.object({
  name: z.string().min(1, "Tool name is required"),
  description: z.string().min(1, "Tool description is required"),
  schema: z.string().catch("{}"), // JSON schema string
  endpoint: z.string().url().optional(),
});

export const aiAgentSettingsSchema = z.object({
  // Node identification
  name: z.string().catch("AI Agent"),

  // Model configuration - LangChain 1.0 style
  model: z.string().catch("gpt-4o"),

  // Agent behavior
  systemPrompt: z.string().catch("You are a helpful assistant."),
  maxIterations: z.number().min(1).max(50).catch(10),

  // Built-in tools
  enabledTools: z
    .array(z.enum(["http", "code", "calculator"]))
    .catch([]),

  // Custom tools
  customTools: z.array(customToolSchema).catch([]),

  // Input configuration
  prompt: z.string().catch(""), // Direct prompt text
  inputVariable: z.string().catch(""), // Variable from context (optional)
  
  // Output configuration
  outputFormat: z.enum(["text", "json"]).catch("text"),
  outputSchema: z.string().optional(), // JSON schema for structured output
});

export type CustomTool = z.infer<typeof customToolSchema>;
export type AIAgentSettings = z.infer<typeof aiAgentSettingsSchema>;

// Available models for the UI
export const AVAILABLE_MODELS = {
  openai: [
    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "o3", label: "o3" },
    { value: "o3-mini", label: "o3 Mini" },
    { value: "o1", label: "o1" },
  ],
  anthropic: [
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { value: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet" },
    { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
  ],
  google: [
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  ],
  groq: [
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
    { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
    { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    { value: "gemma2-9b-it", label: "Gemma 2 9B" },
  ],
} as const;

export const ALL_MODELS = [
  ...AVAILABLE_MODELS.openai,
  ...AVAILABLE_MODELS.anthropic,
  ...AVAILABLE_MODELS.google,
  ...AVAILABLE_MODELS.groq,
];
