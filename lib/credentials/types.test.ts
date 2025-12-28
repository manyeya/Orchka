import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  CredentialType,
  validateCredentialData,
  isValidCredentialType,
  apiKeyCredentialSchema,
  basicAuthCredentialSchema,
  bearerTokenCredentialSchema,
  oauth2CredentialSchema,
  openaiCredentialSchema,
  anthropicCredentialSchema,
  googleAICredentialSchema,
  isApiKeyCredential,
  isBasicAuthCredential,
  isBearerTokenCredential,
  isOAuth2Credential,
  isOpenAICredential,
  isAnthropicCredential,
  isGoogleAICredential,
  getRequiredFields,
  getCredentialTypeLabel,
} from "./types";

describe("Credential Types Property Tests", () => {
  /**
   * **Feature: secure-credentials, Property 12: Schema Validation**
   * *For any* credential creation request, if the data does not match the schema
   * for the specified type, the request SHALL be rejected with a validation error.
   * **Validates: Requirements 5.1**
   */

  // Arbitrary for generating valid API Key credentials
  const validApiKeyArb = fc.record({
    apiKey: fc.string({ minLength: 1 }),
  });

  // Arbitrary for generating valid Basic Auth credentials
  const validBasicAuthArb = fc.record({
    username: fc.string({ minLength: 1 }),
    password: fc.string({ minLength: 1 }),
  });

  // Arbitrary for generating valid Bearer Token credentials
  const validBearerTokenArb = fc.record({
    token: fc.string({ minLength: 1 }),
  });

  // Arbitrary for generating valid OAuth2 credentials
  const validOAuth2Arb = fc.record({
    clientId: fc.string({ minLength: 1 }),
    clientSecret: fc.string({ minLength: 1 }),
    accessToken: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
    refreshToken: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  });

  // Arbitrary for generating valid OpenAI credentials
  const validOpenAIArb = fc.record({
    apiKey: fc.string({ minLength: 1 }),
    organization: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  });

  // Arbitrary for generating valid Anthropic credentials
  const validAnthropicArb = fc.record({
    apiKey: fc.string({ minLength: 1 }),
  });

  // Arbitrary for generating valid Google AI credentials
  const validGoogleAIArb = fc.record({
    apiKey: fc.string({ minLength: 1 }),
  });

  it("Property 12: Valid API Key credentials pass validation", () => {
    fc.assert(
      fc.property(validApiKeyArb, (data) => {
        const result = validateCredentialData(CredentialType.API_KEY, data);
        return result.success === true;
      }),
      { numRuns: 100 }
    );
  });

  it("Property 12: Valid Basic Auth credentials pass validation", () => {
    fc.assert(
      fc.property(validBasicAuthArb, (data) => {
        const result = validateCredentialData(CredentialType.BASIC_AUTH, data);
        return result.success === true;
      }),
      { numRuns: 100 }
    );
  });

  it("Property 12: Valid Bearer Token credentials pass validation", () => {
    fc.assert(
      fc.property(validBearerTokenArb, (data) => {
        const result = validateCredentialData(CredentialType.BEARER_TOKEN, data);
        return result.success === true;
      }),
      { numRuns: 100 }
    );
  });

  it("Property 12: Valid OAuth2 credentials pass validation", () => {
    fc.assert(
      fc.property(validOAuth2Arb, (data) => {
        const result = validateCredentialData(CredentialType.OAUTH2, data);
        return result.success === true;
      }),
      { numRuns: 100 }
    );
  });

  it("Property 12: Valid OpenAI credentials pass validation", () => {
    fc.assert(
      fc.property(validOpenAIArb, (data) => {
        const result = validateCredentialData(CredentialType.OPENAI, data);
        return result.success === true;
      }),
      { numRuns: 100 }
    );
  });

  it("Property 12: Valid Anthropic credentials pass validation", () => {
    fc.assert(
      fc.property(validAnthropicArb, (data) => {
        const result = validateCredentialData(CredentialType.ANTHROPIC, data);
        return result.success === true;
      }),
      { numRuns: 100 }
    );
  });

  it("Property 12: Valid Google AI credentials pass validation", () => {
    fc.assert(
      fc.property(validGoogleAIArb, (data) => {
        const result = validateCredentialData(CredentialType.GOOGLE_AI, data);
        return result.success === true;
      }),
      { numRuns: 100 }
    );
  });

  it("Property 12: Missing required fields cause validation failure", () => {
    // Generate objects missing required fields for each type
    const credentialTypes = Object.values(CredentialType);

    fc.assert(
      fc.property(
        fc.constantFrom(...credentialTypes),
        fc.record({
          // Generate random fields that won't match required fields
          randomField: fc.string(),
          anotherField: fc.string(),
        }),
        (type, invalidData) => {
          const result = validateCredentialData(type, invalidData);
          // Should fail because required fields are missing
          return result.success === false && result.error !== undefined;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Property 12: Empty string values for required fields cause validation failure", () => {
    fc.assert(
      fc.property(fc.constantFrom(...Object.values(CredentialType)), (type) => {
        // Create data with empty strings for all required fields
        const requiredFields = getRequiredFields(type);
        const emptyData: Record<string, string> = {};
        for (const field of requiredFields) {
          emptyData[field] = "";
        }

        const result = validateCredentialData(type, emptyData);
        return result.success === false && result.error !== undefined;
      }),
      { numRuns: 100 }
    );
  });

  it("Property 12: Type mismatch between credential type and data causes validation failure", () => {
    // API Key data should fail for Basic Auth type
    fc.assert(
      fc.property(validApiKeyArb, (apiKeyData) => {
        const result = validateCredentialData(
          CredentialType.BASIC_AUTH,
          apiKeyData
        );
        return result.success === false;
      }),
      { numRuns: 100 }
    );
  });
});

describe("Credential Types Unit Tests", () => {
  describe("isValidCredentialType", () => {
    it("should return true for valid credential types", () => {
      expect(isValidCredentialType("api_key")).toBe(true);
      expect(isValidCredentialType("basic_auth")).toBe(true);
      expect(isValidCredentialType("bearer_token")).toBe(true);
      expect(isValidCredentialType("oauth2")).toBe(true);
      expect(isValidCredentialType("openai")).toBe(true);
      expect(isValidCredentialType("anthropic")).toBe(true);
      expect(isValidCredentialType("google_ai")).toBe(true);
    });

    it("should return false for invalid credential types", () => {
      expect(isValidCredentialType("invalid")).toBe(false);
      expect(isValidCredentialType("")).toBe(false);
      expect(isValidCredentialType("API_KEY")).toBe(false); // Case sensitive
    });
  });

  describe("Type Guards", () => {
    it("isApiKeyCredential should correctly identify API Key credentials", () => {
      expect(isApiKeyCredential({ apiKey: "test-key" })).toBe(true);
      expect(isApiKeyCredential({ apiKey: "" })).toBe(false);
      expect(isApiKeyCredential({ token: "test" })).toBe(false);
    });

    it("isBasicAuthCredential should correctly identify Basic Auth credentials", () => {
      expect(
        isBasicAuthCredential({ username: "user", password: "pass" })
      ).toBe(true);
      expect(isBasicAuthCredential({ username: "", password: "pass" })).toBe(
        false
      );
      expect(isBasicAuthCredential({ apiKey: "test" })).toBe(false);
    });

    it("isBearerTokenCredential should correctly identify Bearer Token credentials", () => {
      expect(isBearerTokenCredential({ token: "test-token" })).toBe(true);
      expect(isBearerTokenCredential({ token: "" })).toBe(false);
      expect(isBearerTokenCredential({ apiKey: "test" })).toBe(false);
    });

    it("isOAuth2Credential should correctly identify OAuth2 credentials", () => {
      expect(
        isOAuth2Credential({ clientId: "id", clientSecret: "secret" })
      ).toBe(true);
      expect(
        isOAuth2Credential({
          clientId: "id",
          clientSecret: "secret",
          accessToken: "token",
        })
      ).toBe(true);
      expect(isOAuth2Credential({ clientId: "", clientSecret: "secret" })).toBe(
        false
      );
    });

    it("isOpenAICredential should correctly identify OpenAI credentials", () => {
      expect(isOpenAICredential({ apiKey: "sk-test" })).toBe(true);
      expect(isOpenAICredential({ apiKey: "sk-test", organization: "org" })).toBe(
        true
      );
      expect(isOpenAICredential({ apiKey: "" })).toBe(false);
    });

    it("isAnthropicCredential should correctly identify Anthropic credentials", () => {
      expect(isAnthropicCredential({ apiKey: "sk-ant-test" })).toBe(true);
      expect(isAnthropicCredential({ apiKey: "" })).toBe(false);
    });

    it("isGoogleAICredential should correctly identify Google AI credentials", () => {
      expect(isGoogleAICredential({ apiKey: "AIza-test" })).toBe(true);
      expect(isGoogleAICredential({ apiKey: "" })).toBe(false);
    });
  });

  describe("getCredentialTypeLabel", () => {
    it("should return correct labels for all credential types", () => {
      expect(getCredentialTypeLabel(CredentialType.API_KEY)).toBe("API Key");
      expect(getCredentialTypeLabel(CredentialType.BASIC_AUTH)).toBe(
        "Basic Auth"
      );
      expect(getCredentialTypeLabel(CredentialType.BEARER_TOKEN)).toBe(
        "Bearer Token"
      );
      expect(getCredentialTypeLabel(CredentialType.OAUTH2)).toBe("OAuth2");
      expect(getCredentialTypeLabel(CredentialType.OPENAI)).toBe("OpenAI");
      expect(getCredentialTypeLabel(CredentialType.ANTHROPIC)).toBe("Anthropic");
      expect(getCredentialTypeLabel(CredentialType.GOOGLE_AI)).toBe("Google AI");
    });
  });

  describe("getRequiredFields", () => {
    it("should return correct required fields for each type", () => {
      expect(getRequiredFields(CredentialType.API_KEY)).toEqual(["apiKey"]);
      expect(getRequiredFields(CredentialType.BASIC_AUTH)).toEqual([
        "username",
        "password",
      ]);
      expect(getRequiredFields(CredentialType.BEARER_TOKEN)).toEqual(["token"]);
      expect(getRequiredFields(CredentialType.OAUTH2)).toEqual([
        "clientId",
        "clientSecret",
      ]);
      expect(getRequiredFields(CredentialType.OPENAI)).toEqual(["apiKey"]);
      expect(getRequiredFields(CredentialType.ANTHROPIC)).toEqual(["apiKey"]);
      expect(getRequiredFields(CredentialType.GOOGLE_AI)).toEqual(["apiKey"]);
    });
  });

  describe("validateCredentialData", () => {
    it("should return error for unknown credential type", () => {
      const result = validateCredentialData(
        "unknown_type" as CredentialType,
        { apiKey: "test" }
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown credential type");
    });

    it("should return validated data on success", () => {
      const result = validateCredentialData(CredentialType.API_KEY, {
        apiKey: "test-key",
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ apiKey: "test-key" });
    });

    it("should return field-specific error messages", () => {
      const result = validateCredentialData(CredentialType.BASIC_AUTH, {
        username: "",
        password: "",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("username");
      expect(result.error).toContain("password");
    });
  });
});
