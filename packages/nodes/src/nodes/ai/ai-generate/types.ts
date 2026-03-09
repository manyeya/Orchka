/**
 * AI Generate Node Types
 * Simple text generation using AI SDK v6
 */
import { z } from "zod";

export const aiGenerateSettingsSchema = z.object({
  name: z.string().default("AI Generate"),
  model: z.string().default("gpt-4o"),
  credentialId: z.string().optional(),
  systemPrompt: z.string().default("You are a helpful assistant."),
  prompt: z.string().default(""),
  inputVariable: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(128000).optional(),
});

export type AIGenerateSettings = z.infer<typeof aiGenerateSettingsSchema>;
