import prisma from "@/lib/db";
import { encrypt, decrypt } from "@/lib/credentials/encryption";
import {
  CredentialType,
  validateCredentialData,
  isValidCredentialType,
} from "@/lib/credentials/types";
import {
  logCredentialCreate,
  logCredentialUpdate,
  logCredentialDelete,
  logCredentialAccess,
} from "@/lib/credentials/audit-log";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// Timeout for credential validation requests (10 seconds)
const TEST_TIMEOUT_MS = 10000;

// ============================================================================
// Input Schemas
// ============================================================================

const createCredentialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(CredentialType),
  data: z.record(z.string(), z.unknown()),
});

const updateCredentialSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

const idSchema = z.object({
  id: z.string(),
});

const listByTypeSchema = z.object({
  type: z.nativeEnum(CredentialType).optional(),
});

const testCredentialSchema = z.object({
  type: z.nativeEnum(CredentialType),
  data: z.record(z.string(), z.unknown()),
});

// ============================================================================
// Credential Testing Functions
// ============================================================================

interface TestResult {
  success: boolean;
  error?: string;
}

/**
 * Test a credential by making a validation request to the target service
 * Requirements: 6.1, 6.4
 */
async function testCredential(
  type: CredentialType,
  data: Record<string, unknown>
): Promise<TestResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TEST_TIMEOUT_MS);

  try {
    switch (type) {
      case CredentialType.OPENAI:
        return await testOpenAICredential(
          data as { apiKey: string; organization?: string },
          controller.signal
        );
      case CredentialType.ANTHROPIC:
        return await testAnthropicCredential(
          data as { apiKey: string },
          controller.signal
        );
      case CredentialType.GOOGLE_AI:
        return await testGoogleAICredential(
          data as { apiKey: string },
          controller.signal
        );
      case CredentialType.API_KEY:
      case CredentialType.BASIC_AUTH:
      case CredentialType.BEARER_TOKEN:
      case CredentialType.OAUTH2:
        // Generic credentials cannot be tested without a target URL
        return {
          success: true,
          error: undefined,
        };
      default:
        return {
          success: false,
          error: `Testing not supported for credential type: ${type}`,
        };
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Test OpenAI API credentials by listing models
 */
async function testOpenAICredential(
  data: { apiKey: string; organization?: string },
  signal: AbortSignal
): Promise<TestResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${data.apiKey}`,
    "Content-Type": "application/json",
  };

  if (data.organization) {
    headers["OpenAI-Organization"] = data.organization;
  }

  const response = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers,
    signal,
  });

  if (response.ok) {
    return { success: true };
  }

  const errorBody = await response.json().catch(() => ({}));
  const errorMessage =
    errorBody?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
  return { success: false, error: errorMessage };
}

/**
 * Test Anthropic API credentials by making a minimal request
 */
async function testAnthropicCredential(
  data: { apiKey: string },
  signal: AbortSignal
): Promise<TestResult> {
  // Anthropic doesn't have a simple "list models" endpoint, so we make a minimal
  // messages request that will fail with a specific error if the key is valid
  // but succeed in validating the API key format
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": data.apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 1,
      messages: [{ role: "user", content: "test" }],
    }),
    signal,
  });

  // A 200 response means the key is valid (though we used tokens)
  // A 401 means invalid API key
  // Other errors (400, 429, etc.) mean the key is valid but there's another issue
  if (response.ok) {
    return { success: true };
  }

  if (response.status === 401) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage =
      errorBody?.error?.message || "Invalid API key";
    return { success: false, error: errorMessage };
  }

  // For other status codes (400, 429, etc.), the key is likely valid
  // but there might be rate limiting or other issues
  if (response.status === 400 || response.status === 429) {
    return { success: true };
  }

  const errorBody = await response.json().catch(() => ({}));
  const errorMessage =
    errorBody?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
  return { success: false, error: errorMessage };
}

/**
 * Test Google AI API credentials by listing models
 */
async function testGoogleAICredential(
  data: { apiKey: string },
  signal: AbortSignal
): Promise<TestResult> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${data.apiKey}`,
    {
      method: "GET",
      signal,
    }
  );

  if (response.ok) {
    return { success: true };
  }

  const errorBody = await response.json().catch(() => ({}));
  const errorMessage =
    errorBody?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
  return { success: false, error: errorMessage };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Clear credential references from all nodes that reference the given credential
 * Requirements: 2.5 - Remove all references to a credential from workflow nodes when deleted
 * 
 * This function finds all nodes belonging to the user's workflows that have the
 * credentialId in their data JSON field, and removes the credentialId and 
 * credentialType properties from the node data.
 */
async function clearCredentialReferencesFromNodes(
  credentialId: string,
  userId: string
): Promise<void> {
  // Find all workflows belonging to the user
  const userWorkflows = await prisma.workflow.findMany({
    where: { userId },
    select: { id: true },
  });

  if (userWorkflows.length === 0) {
    return;
  }

  const workflowIds = userWorkflows.map((w) => w.id);

  // Find all nodes in user's workflows that reference this credential
  // We need to query nodes and check their JSON data field
  const nodes = await prisma.node.findMany({
    where: {
      workflowId: { in: workflowIds },
    },
    select: {
      id: true,
      data: true,
    },
  });

  // Filter nodes that have this credentialId in their data
  const nodesToUpdate = nodes.filter((node) => {
    const data = node.data as Record<string, unknown>;
    return data.credentialId === credentialId;
  });

  // Update each node to remove the credential reference
  for (const node of nodesToUpdate) {
    const data = node.data as Record<string, unknown>;
    // Remove credentialId and credentialType from the data
    const { credentialId: _, credentialType: __, ...cleanedData } = data;
    
    await prisma.node.update({
      where: { id: node.id },
      data: { data: cleanedData as object },
    });
  }
}

// ============================================================================
// Router
// ============================================================================

export const credentialsRouter = createTRPCRouter({
  /**
   * List all credentials for the authenticated user (metadata only)
   * Requirements: 1.3
   */
  list: protectedProcedure
    .input(listByTypeSchema)
    .query(async ({ ctx, input }) => {
      const credentials = await prisma.credential.findMany({
        where: {
          userId: ctx.auth.user.id,
          ...(input.type && { type: input.type }),
        },
        select: {
          id: true,
          name: true,
          type: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return credentials.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type as CredentialType,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
    }),

  /**
   * Get a single credential by ID (metadata only)
   * Requirements: 2.4
   */
  getById: protectedProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const credential = await prisma.credential.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });

    if (!credential) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Credential not found",
      });
    }

    if (credential.userId !== ctx.auth.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not authorized to access this credential",
      });
    }

    return {
      id: credential.id,
      name: credential.name,
      type: credential.type as CredentialType,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    };
  }),

  /**
   * Create a new credential
   * Requirements: 1.1, 1.2, 1.4, 1.5
   */
  create: protectedProcedure
    .input(createCredentialSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.user.id;

      // Validate credential type
      if (!isValidCredentialType(input.type)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid credential type: ${input.type}`,
        });
      }

      // Validate credential data against schema
      const validation = validateCredentialData(input.type, input.data);
      if (!validation.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.error || "Invalid credential data",
        });
      }

      // Check for duplicate name
      const existing = await prisma.credential.findUnique({
        where: {
          userId_name: {
            userId,
            name: input.name,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A credential with name "${input.name}" already exists`,
        });
      }

      // Serialize and encrypt the credential data
      const jsonData = JSON.stringify(input.data);
      const encrypted = encrypt(jsonData);

      // Create the credential in the database
      const credential = await prisma.credential.create({
        data: {
          name: input.name,
          type: input.type,
          encryptedData: encrypted.encryptedData,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          userId,
        },
      });

      // Log the creation event (Requirements: 7.2)
      await logCredentialCreate(credential.id, userId);

      return {
        id: credential.id,
        name: credential.name,
        type: credential.type as CredentialType,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
      };
    }),

  /**
   * Update an existing credential
   * Requirements: 2.1, 2.2, 2.4
   */
  update: protectedProcedure
    .input(updateCredentialSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.user.id;

      // Fetch existing credential
      const existing = await prisma.credential.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        });
      }

      // Authorization check
      if (existing.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to modify this credential",
        });
      }

      // Prepare update data
      const updateData: {
        name?: string;
        encryptedData?: string;
        iv?: string;
        authTag?: string;
      } = {};

      // Handle name update with uniqueness check
      if (input.name && input.name !== existing.name) {
        const duplicate = await prisma.credential.findUnique({
          where: {
            userId_name: {
              userId,
              name: input.name,
            },
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `A credential with name "${input.name}" already exists`,
          });
        }

        updateData.name = input.name;
      }

      // Handle data update with re-encryption
      if (input.data) {
        const credentialType = existing.type as CredentialType;
        const validation = validateCredentialData(credentialType, input.data);
        if (!validation.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: validation.error || "Invalid credential data",
          });
        }

        const jsonData = JSON.stringify(input.data);
        const encrypted = encrypt(jsonData);

        updateData.encryptedData = encrypted.encryptedData;
        updateData.iv = encrypted.iv;
        updateData.authTag = encrypted.authTag;
      }

      // Update the credential
      const updated = await prisma.credential.update({
        where: { id: input.id },
        data: updateData,
      });

      // Log the update event (Requirements: 7.2)
      await logCredentialUpdate(updated.id, userId);

      return {
        id: updated.id,
        name: updated.name,
        type: updated.type as CredentialType,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    }),

  /**
   * Delete a credential
   * Requirements: 2.3, 2.4, 2.5
   */
  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      const credential = await prisma.credential.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!credential) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        });
      }

      // Authorization check
      if (credential.userId !== ctx.auth.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this credential",
        });
      }

      // Log the deletion event before deleting (Requirements: 7.2)
      await logCredentialDelete(input.id, ctx.auth.user.id);

      // Find and clear all node references to this credential (Requirements: 2.5)
      // Nodes store credentialId in their JSON data field
      await clearCredentialReferencesFromNodes(input.id, ctx.auth.user.id);

      await prisma.credential.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get decrypted credential data (for internal use/execution)
   * Requirements: 3.3
   */
  getDecrypted: protectedProcedure
    .input(idSchema)
    .query(async ({ ctx, input }) => {
      const credential = await prisma.credential.findUnique({
        where: { id: input.id },
      });

      if (!credential) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        });
      }

      // Authorization check
      if (credential.userId !== ctx.auth.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to access this credential",
        });
      }

      // Decrypt the credential data
      const decryptedJson = decrypt(
        credential.encryptedData,
        credential.iv,
        credential.authTag
      );
      const data = JSON.parse(decryptedJson);

      return {
        id: credential.id,
        name: credential.name,
        type: credential.type as CredentialType,
        data,
      };
    }),

  /**
   * Test a credential by validating it with the target service
   * Requirements: 6.1, 6.2, 6.3, 6.4
   */
  test: protectedProcedure
    .input(testCredentialSchema)
    .mutation(async ({ input }) => {
      // Validate credential data against schema first
      const validation = validateCredentialData(input.type, input.data);
      if (!validation.success) {
        return {
          success: false,
          error: validation.error || "Invalid credential data",
        };
      }

      try {
        const result = await testCredential(input.type, input.data);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),
});

// ============================================================================
// Helper functions for workflow execution (server-side only)
// ============================================================================

/**
 * Get a decrypted credential for workflow execution context
 * This function is used during workflow execution and verifies ownership
 * Requirements: 3.3, 3.4
 */
export async function getCredentialForExecution(
  credentialId: string,
  workflowId: string
): Promise<{
  id: string;
  name: string;
  type: CredentialType;
  data: Record<string, unknown>;
}> {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    throw new Error(`Credential not found: ${credentialId}`);
  }

  // Verify the workflow belongs to the same user as the credential
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { userId: true },
  });

  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  if (workflow.userId !== credential.userId) {
    throw new Error("Credential does not belong to the workflow owner");
  }

  // Log the access event (Requirements: 7.1)
  await logCredentialAccess(credentialId, credential.userId, workflowId);

  // Decrypt the credential data
  const decryptedJson = decrypt(
    credential.encryptedData,
    credential.iv,
    credential.authTag
  );
  const data = JSON.parse(decryptedJson);

  return {
    id: credential.id,
    name: credential.name,
    type: credential.type as CredentialType,
    data,
  };
}
