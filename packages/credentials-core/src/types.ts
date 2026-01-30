import { z } from "zod";

/**
 * Enum of supported credential types
 */
export enum CredentialType {
  API_KEY = "api_key",
  BASIC_AUTH = "basic_auth",
  BEARER_TOKEN = "bearer_token",
  OAUTH2 = "oauth2",
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE_AI = "google_ai",
}

// ============================================================================
// Zod Schemas for each credential type
// ============================================================================

/**
 * API Key credential schema - requires a single apiKey field
 * Requirements: 5.5
 */
export const apiKeyCredentialSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});
export type ApiKeyCredential = z.infer<typeof apiKeyCredentialSchema>;

/**
 * Basic Auth credential schema - requires username and password
 * Requirements: 5.6
 */
export const basicAuthCredentialSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
export type BasicAuthCredential = z.infer<typeof basicAuthCredentialSchema>;

/**
 * Bearer Token credential schema - requires a single token field
 * Requirements: 5.7
 */
export const bearerTokenCredentialSchema = z.object({
  token: z.string().min(1, "Token is required"),
});
export type BearerTokenCredential = z.infer<typeof bearerTokenCredentialSchema>;

/**
 * OAuth2 credential schema - requires clientId and clientSecret,
 * optionally accessToken and refreshToken
 * Requirements: 5.8
 */
export const oauth2CredentialSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client secret is required"),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});
export type OAuth2Credential = z.infer<typeof oauth2CredentialSchema>;

/**
 * OpenAI credential schema - requires apiKey, optionally organization
 */
export const openaiCredentialSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  organization: z.string().optional(),
});
export type OpenAICredential = z.infer<typeof openaiCredentialSchema>;

/**
 * Anthropic credential schema - requires apiKey
 */
export const anthropicCredentialSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});
export type AnthropicCredential = z.infer<typeof anthropicCredentialSchema>;

/**
 * Google AI credential schema - requires apiKey
 */
export const googleAICredentialSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});
export type GoogleAICredential = z.infer<typeof googleAICredentialSchema>;

// ============================================================================
// Schema mapping by credential type
// ============================================================================

/**
 * Map of credential type to its corresponding Zod schema
 */
export const credentialSchemaMap: Record<CredentialType, z.ZodSchema> = {
  [CredentialType.API_KEY]: apiKeyCredentialSchema,
  [CredentialType.BASIC_AUTH]: basicAuthCredentialSchema,
  [CredentialType.BEARER_TOKEN]: bearerTokenCredentialSchema,
  [CredentialType.OAUTH2]: oauth2CredentialSchema,
  [CredentialType.OPENAI]: openaiCredentialSchema,
  [CredentialType.ANTHROPIC]: anthropicCredentialSchema,
  [CredentialType.GOOGLE_AI]: googleAICredentialSchema,
};

// ============================================================================
// Union type for all credential data
// ============================================================================

export type CredentialData =
  | ApiKeyCredential
  | BasicAuthCredential
  | BearerTokenCredential
  | OAuth2Credential
  | OpenAICredential
  | AnthropicCredential
  | GoogleAICredential;

// ============================================================================
// Type Guards
// ============================================================================

export function isApiKeyCredential(data: unknown): data is ApiKeyCredential {
  return apiKeyCredentialSchema.safeParse(data).success;
}

export function isBasicAuthCredential(
  data: unknown
): data is BasicAuthCredential {
  return basicAuthCredentialSchema.safeParse(data).success;
}

export function isBearerTokenCredential(
  data: unknown
): data is BearerTokenCredential {
  return bearerTokenCredentialSchema.safeParse(data).success;
}

export function isOAuth2Credential(data: unknown): data is OAuth2Credential {
  return oauth2CredentialSchema.safeParse(data).success;
}

export function isOpenAICredential(data: unknown): data is OpenAICredential {
  return openaiCredentialSchema.safeParse(data).success;
}

export function isAnthropicCredential(
  data: unknown
): data is AnthropicCredential {
  return anthropicCredentialSchema.safeParse(data).success;
}

export function isGoogleAICredential(
  data: unknown
): data is GoogleAICredential {
  return googleAICredentialSchema.safeParse(data).success;
}

// ============================================================================
// Validation Functions
// ============================================================================

export interface ValidationResult {
  success: boolean;
  data?: CredentialData;
  error?: string;
}

/**
 * Validate credential data against the schema for the specified type.
 * Requirements: 5.1
 *
 * @param type - The credential type
 * @param data - The credential data to validate
 * @returns ValidationResult with success status and either data or error
 */
export function validateCredentialData(
  type: CredentialType,
  data: unknown
): ValidationResult {
  const schema = credentialSchemaMap[type];
  if (!schema) {
    return {
      success: false,
      error: `Unknown credential type: ${type}`,
    };
  }

  const result = schema.safeParse(data);
  if (result.success) {
    return {
      success: true,
      data: result.data as CredentialData,
    };
  }

  // Format Zod errors into a readable string
  const errorMessages = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  return {
    success: false,
    error: errorMessages,
  };
}

/**
 * Check if a string is a valid CredentialType
 */
export function isValidCredentialType(type: string): type is CredentialType {
  return Object.values(CredentialType).includes(type as CredentialType);
}

/**
 * Get the schema for a credential type
 */
export function getSchemaForType(type: CredentialType): z.ZodSchema {
  return credentialSchemaMap[type];
}

/**
 * Get human-readable label for a credential type
 */
export function getCredentialTypeLabel(type: CredentialType): string {
  const labels: Record<CredentialType, string> = {
    [CredentialType.API_KEY]: "API Key",
    [CredentialType.BASIC_AUTH]: "Basic Auth",
    [CredentialType.BEARER_TOKEN]: "Bearer Token",
    [CredentialType.OAUTH2]: "OAuth2",
    [CredentialType.OPENAI]: "OpenAI",
    [CredentialType.ANTHROPIC]: "Anthropic",
    [CredentialType.GOOGLE_AI]: "Google AI",
  };
  return labels[type];
}

/**
 * Get required fields for a credential type
 */
export function getRequiredFields(type: CredentialType): string[] {
  const requiredFields: Record<CredentialType, string[]> = {
    [CredentialType.API_KEY]: ["apiKey"],
    [CredentialType.BASIC_AUTH]: ["username", "password"],
    [CredentialType.BEARER_TOKEN]: ["token"],
    [CredentialType.OAUTH2]: ["clientId", "clientSecret"],
    [CredentialType.OPENAI]: ["apiKey"],
    [CredentialType.ANTHROPIC]: ["apiKey"],
    [CredentialType.GOOGLE_AI]: ["apiKey"],
  };
  return requiredFields[type];
}
