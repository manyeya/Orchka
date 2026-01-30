/**
 * AI Extract Node Types
 * Structured data extraction using AI SDK v6 generateObject
 */
import { z } from "zod";

export const aiExtractSettingsSchema = z.object({
  name: z.string().default("AI Extract"),
  model: z.string().default("gpt-4o"),
  credentialId: z.string().optional(),
  systemPrompt: z.string().default("Extract the requested information from the input."),
  prompt: z.string().default(""),
  inputVariable: z.string().optional(),
  // JSON Schema string that will be converted to Zod at runtime
  outputSchema: z.string().default(`{
  "type": "object",
  "properties": {
    "result": { "type": "string" }
  },
  "required": ["result"]
}`),
  temperature: z.number().min(0).max(2).default(0.3),
});

export type AIExtractSettings = z.infer<typeof aiExtractSettingsSchema>;

// Common extraction schemas for UI
export const EXTRACTION_TEMPLATES = {
  entity: {
    name: "Entity Extraction",
    schema: `{
  "type": "object",
  "properties": {
    "entities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "type": { "type": "string" },
          "value": { "type": "string" }
        }
      }
    }
  }
}`,
  },
  contact: {
    name: "Contact Info",
    schema: `{
  "type": "object",
  "properties": {
    "name": { "type": "string", "nullable": true },
    "email": { "type": "string", "nullable": true },
    "phone": { "type": "string", "nullable": true },
    "company": { "type": "string", "nullable": true }
  }
}`,
  },
  summary: {
    name: "Summary",
    schema: `{
  "type": "object",
  "properties": {
    "summary": { "type": "string" },
    "keyPoints": { "type": "array", "items": { "type": "string" } },
    "sentiment": { "type": "string", "enum": ["positive", "neutral", "negative"] }
  }
}`,
  },
};
