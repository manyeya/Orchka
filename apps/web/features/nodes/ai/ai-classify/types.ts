/**
 * AI Classify Node Types
 * Classification tasks using AI SDK v6 generateObject with enum output
 */
import { z } from "zod";

export const aiClassifySettingsSchema = z.object({
  name: z.string().default("AI Classify"),
  model: z.string().default("gpt-4o-mini"),
  credentialId: z.string().optional(),
  systemPrompt: z.string().default("Classify the input into one of the provided categories."),
  prompt: z.string().default(""),
  inputVariable: z.string().optional(),
  // Categories for classification
  categories: z.array(z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })).default([
    { value: "positive", label: "Positive", description: "Positive sentiment or outcome" },
    { value: "negative", label: "Negative", description: "Negative sentiment or outcome" },
    { value: "neutral", label: "Neutral", description: "Neutral or unclear" },
  ]),
  // Include confidence score
  includeConfidence: z.boolean().default(true),
  // Include reasoning
  includeReasoning: z.boolean().default(false),
  temperature: z.number().min(0).max(2).default(0.1),
});

export type AIClassifySettings = z.infer<typeof aiClassifySettingsSchema>;

// Common classification templates
export const CLASSIFICATION_TEMPLATES = {
  sentiment: {
    name: "Sentiment Analysis",
    categories: [
      { value: "positive", label: "Positive", description: "Positive sentiment" },
      { value: "negative", label: "Negative", description: "Negative sentiment" },
      { value: "neutral", label: "Neutral", description: "Neutral sentiment" },
    ],
  },
  intent: {
    name: "Intent Detection",
    categories: [
      { value: "question", label: "Question", description: "User is asking a question" },
      { value: "request", label: "Request", description: "User is making a request" },
      { value: "complaint", label: "Complaint", description: "User is complaining" },
      { value: "feedback", label: "Feedback", description: "User is providing feedback" },
      { value: "other", label: "Other", description: "Other intent" },
    ],
  },
  priority: {
    name: "Priority Classification",
    categories: [
      { value: "urgent", label: "Urgent", description: "Requires immediate attention" },
      { value: "high", label: "High", description: "High priority" },
      { value: "medium", label: "Medium", description: "Medium priority" },
      { value: "low", label: "Low", description: "Low priority" },
    ],
  },
  spam: {
    name: "Spam Detection",
    categories: [
      { value: "spam", label: "Spam", description: "Spam or unwanted content" },
      { value: "not_spam", label: "Not Spam", description: "Legitimate content" },
    ],
  },
};
