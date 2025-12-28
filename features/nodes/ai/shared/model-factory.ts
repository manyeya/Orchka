/**
 * Shared AI SDK model factory for all AI nodes
 * Uses AI SDK unified provider interface
 */
import { google } from "@ai-sdk/google";
import { NonRetriableError } from "inngest";
import {
  CredentialType,
  isOpenAICredential,
  isAnthropicCredential,
  isGoogleAICredential,
} from "@/lib/credentials/types";
import type { DecryptedCredential } from "@/lib/credentials/execution";

// Use a flexible type that works with both v2 and v3 models
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AIModel = any;

export interface AICredentialConfig {
  apiKey: string;
  organization?: string;
}

/**
 * Extract AI credential configuration from decrypted credential
 */
export function extractAICredentialConfig(
  credential: DecryptedCredential,
  modelString: string
): AICredentialConfig {
  const { type, data } = credential;
  const expectedType = getExpectedCredentialType(modelString);
  
  if (expectedType && type !== expectedType) {
    throw new NonRetriableError(
      `Credential type mismatch: expected ${expectedType} for model ${modelString}, got ${type}`
    );
  }
  
  if (type === CredentialType.OPENAI && isOpenAICredential(data)) {
    return { apiKey: data.apiKey, organization: data.organization };
  }
  
  if (type === CredentialType.ANTHROPIC && isAnthropicCredential(data)) {
    return { apiKey: data.apiKey };
  }
  
  if (type === CredentialType.GOOGLE_AI && isGoogleAICredential(data)) {
    return { apiKey: data.apiKey };
  }
  
  throw new NonRetriableError(`Unsupported credential type for AI: ${type}`);
}

/**
 * Get the expected credential type for a model string
 */
export function getExpectedCredentialType(modelString: string): CredentialType | null {
  if (modelString.startsWith("gpt-") || modelString.startsWith("o1") || modelString.startsWith("o3")) {
    return CredentialType.OPENAI;
  }
  if (modelString.startsWith("claude-")) {
    return CredentialType.ANTHROPIC;
  }
  if (modelString.startsWith("gemini-")) {
    return CredentialType.GOOGLE_AI;
  }
  return null;
}

/**
 * Create AI SDK model instance from model string
 * Uses dynamic imports to support multiple providers
 * 
 * IMPORTANT: Either pass credentialConfig with apiKey, or set environment variables:
 * - OpenAI: OPENAI_API_KEY
 * - Anthropic: ANTHROPIC_API_KEY  
 * - Google: GOOGLE_GENERATIVE_AI_API_KEY
 */
export async function createAIModelAsync(
  modelString: string,
  credentialConfig: AICredentialConfig | null
): Promise<AIModel> {
  // OpenAI models - requires @ai-sdk/openai
  if (modelString.startsWith("gpt-") || modelString.startsWith("o1") || modelString.startsWith("o3")) {
    const apiKey = credentialConfig?.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new NonRetriableError(
        `OpenAI API key is missing. Either select an OpenAI credential in the node settings, or set OPENAI_API_KEY environment variable.`
      );
    }
    const { createOpenAI } = await import("@ai-sdk/openai");
    const openai = createOpenAI({
      apiKey,
      organization: credentialConfig?.organization,
    });
    return openai(modelString);
  }

  // Anthropic models - requires @ai-sdk/anthropic
  if (modelString.startsWith("claude-")) {
    const apiKey = credentialConfig?.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new NonRetriableError(
        `Anthropic API key is missing. Either select an Anthropic credential in the node settings, or set ANTHROPIC_API_KEY environment variable.`
      );
    }
    const { createAnthropic } = await import("@ai-sdk/anthropic");
    const anthropic = createAnthropic({ apiKey });
    return anthropic(modelString);
  }

  // Google models
  if (modelString.startsWith("gemini-")) {
    const apiKey = credentialConfig?.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new NonRetriableError(
        `Google AI API key is missing. Either select a Google AI credential in the node settings, or set GOOGLE_GENERATIVE_AI_API_KEY environment variable.`
      );
    }
    const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
    const googleAI = createGoogleGenerativeAI({ apiKey });
    return googleAI(modelString);
  }

  // Default - try Google
  const apiKey = credentialConfig?.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new NonRetriableError(
      `No API key configured. Select a credential in the node settings or set the appropriate environment variable.`
    );
  }
  const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
  const googleAI = createGoogleGenerativeAI({ apiKey });
  return googleAI(modelString);
}

/**
 * Synchronous version using Google provider (always available)
 * NOTE: This doesn't support credentials - use createAIModelAsync for credential support
 */
export function createAIModel(
  modelString: string,
  _credentialConfig: AICredentialConfig | null
): AIModel {
  // For now, only Google is synchronously available without credentials
  // Other providers need async import
  // This will use GOOGLE_GENERATIVE_AI_API_KEY env var
  return google(modelString);
}

// Available models for UI
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
  ],
} as const;

export const ALL_MODELS = [
  ...AVAILABLE_MODELS.openai,
  ...AVAILABLE_MODELS.anthropic,
  ...AVAILABLE_MODELS.google,
];
