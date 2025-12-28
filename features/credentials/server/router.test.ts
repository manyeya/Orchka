import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import {
  CredentialType,
  ApiKeyCredential,
  BasicAuthCredential,
  BearerTokenCredential,
} from "@/lib/credentials/types";

// Mock prisma before importing the router
const mockCredentials = new Map<string, any>();
const mockWorkflows = new Map<string, any>();
const mockNodes = new Map<string, any>();
const mockCredentialLogs: any[] = [];

vi.mock("@/lib/db", () => {
  return {
    default: {
      credential: {
        findUnique: vi.fn(async ({ where }: any) => {
          if (where.id) {
            return mockCredentials.get(where.id) || null;
          }
          if (where.userId_name) {
            for (const cred of mockCredentials.values()) {
              if (
                cred.userId === where.userId_name.userId &&
                cred.name === where.userId_name.name
              ) {
                return cred;
              }
            }
            return null;
          }
          return null;
        }),
        findMany: vi.fn(async ({ where }: any) => {
          const results: any[] = [];
          for (const cred of mockCredentials.values()) {
            if (where.userId && cred.userId !== where.userId) continue;
            if (where.type && cred.type !== where.type) continue;
            results.push(cred);
          }
          return results;
        }),
        create: vi.fn(async ({ data }: any) => {
          const id = `cred_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
          const credential = {
            id,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockCredentials.set(id, credential);
          return credential;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const existing = mockCredentials.get(where.id);
          if (!existing) throw new Error("Not found");
          const updated = {
            ...existing,
            ...data,
            updatedAt: new Date(),
          };
          mockCredentials.set(where.id, updated);
          return updated;
        }),
        delete: vi.fn(async ({ where }: any) => {
          const existing = mockCredentials.get(where.id);
          if (!existing) throw new Error("Not found");
          mockCredentials.delete(where.id);
          return existing;
        }),
      },
      workflow: {
        findUnique: vi.fn(async ({ where }: any) => {
          return mockWorkflows.get(where.id) || null;
        }),
        findMany: vi.fn(async ({ where }: any) => {
          const results: any[] = [];
          for (const workflow of mockWorkflows.values()) {
            if (where.userId && workflow.userId !== where.userId) continue;
            results.push(workflow);
          }
          return results;
        }),
      },
      node: {
        findMany: vi.fn(async ({ where }: any) => {
          const results: any[] = [];
          for (const node of mockNodes.values()) {
            if (where.workflowId) {
              if (Array.isArray(where.workflowId.in)) {
                if (!where.workflowId.in.includes(node.workflowId)) continue;
              } else if (node.workflowId !== where.workflowId) {
                continue;
              }
            }
            results.push(node);
          }
          return results;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const existing = mockNodes.get(where.id);
          if (!existing) throw new Error("Node not found");
          const updated = {
            ...existing,
            ...data,
            updatedAt: new Date(),
          };
          mockNodes.set(where.id, updated);
          return updated;
        }),
      },
      credentialLog: {
        create: vi.fn(async ({ data }: any) => {
          const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
          const log = {
            id,
            ...data,
            timestamp: new Date(),
          };
          mockCredentialLogs.push(log);
          return log;
        }),
        findMany: vi.fn(async ({ where }: any) => {
          return mockCredentialLogs.filter((log) => {
            if (where.credentialId && log.credentialId !== where.credentialId) return false;
            if (where.userId && log.userId !== where.userId) return false;
            return true;
          });
        }),
      },
    },
  };
});

// Import after mocking
import { credentialsRouter, getCredentialForExecution } from "./router";
import { createCallerFactory } from "@/trpc/init";

// Set up test encryption key
beforeAll(() => {
  process.env.CREDENTIAL_ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

// Clear mock data before each test
beforeEach(() => {
  mockCredentials.clear();
  mockWorkflows.clear();
  mockNodes.clear();
  mockCredentialLogs.length = 0;
  vi.clearAllMocks();
});

// Create a test caller with mocked auth context
function createTestCaller(userId: string) {
  const createCaller = createCallerFactory(credentialsRouter);
  return createCaller({
    auth: {
      user: { id: userId, name: "Test User", email: "test@example.com", emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
      session: { id: "session-1", expiresAt: new Date(), token: "token", createdAt: new Date(), updatedAt: new Date(), userId },
    },
  });
}

// ============================================================================
// Arbitraries for generating test data
// ============================================================================

const userIdArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

const credentialNameArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

const credentialTypeArb = fc.constantFrom(...Object.values(CredentialType));

const apiKeyDataArb: fc.Arbitrary<ApiKeyCredential> = fc.record({
  apiKey: fc.string({ minLength: 1 }),
});

const basicAuthDataArb: fc.Arbitrary<BasicAuthCredential> = fc.record({
  username: fc.string({ minLength: 1 }),
  password: fc.string({ minLength: 1 }),
});

const bearerTokenDataArb: fc.Arbitrary<BearerTokenCredential> = fc.record({
  token: fc.string({ minLength: 1 }),
});

// Generate valid credential data based on type
function credentialDataForType(type: CredentialType): fc.Arbitrary<Record<string, unknown>> {
  switch (type) {
    case CredentialType.API_KEY:
    case CredentialType.OPENAI:
    case CredentialType.ANTHROPIC:
    case CredentialType.GOOGLE_AI:
      return apiKeyDataArb as fc.Arbitrary<Record<string, unknown>>;
    case CredentialType.BASIC_AUTH:
      return basicAuthDataArb as fc.Arbitrary<Record<string, unknown>>;
    case CredentialType.BEARER_TOKEN:
      return bearerTokenDataArb as fc.Arbitrary<Record<string, unknown>>;
    case CredentialType.OAUTH2:
      return fc.record({
        clientId: fc.string({ minLength: 1 }),
        clientSecret: fc.string({ minLength: 1 }),
      }) as fc.Arbitrary<Record<string, unknown>>;
    default:
      return apiKeyDataArb as fc.Arbitrary<Record<string, unknown>>;
  }
}

// ============================================================================
// Property Tests
// ============================================================================

describe("Credentials Router Property Tests", () => {
  /**
   * **Feature: secure-credentials, Property 2: User Association Integrity**
   * *For any* credential created by a user, the credential's userId field
   * SHALL match the creating user's ID.
   * **Validates: Requirements 1.2**
   */
  it("Property 2: Created credentials are associated with the creating user", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        credentialNameArb,
        credentialTypeArb,
        async (userId, name, type) => {
          // Clear mock data for this iteration
          mockCredentials.clear();

          const caller = createTestCaller(userId);
          const data = fc.sample(credentialDataForType(type), 1)[0];

          const result = await caller.create({ name, type, data });

          // Verify the credential was created with the correct userId
          const stored = mockCredentials.get(result.id);
          return stored !== undefined && stored.userId === userId;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: secure-credentials, Property 3: Metadata Exposure Prevention**
   * *For any* credential list response, the response SHALL contain name, type,
   * and timestamps but SHALL NOT contain encryptedData, iv, authTag, or
   * decrypted credential values.
   * **Validates: Requirements 1.3**
   */
  it("Property 3: List response contains only metadata, no sensitive data", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        fc.array(
          fc.record({
            name: credentialNameArb,
            type: credentialTypeArb,
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (userId, credentialSpecs) => {
          // Clear mock data for this iteration
          mockCredentials.clear();

          const caller = createTestCaller(userId);

          // Create credentials with unique names
          for (let idx = 0; idx < credentialSpecs.length; idx++) {
            const spec = credentialSpecs[idx];
            const uniqueName = `${spec.name}_${idx}`;
            const data = fc.sample(credentialDataForType(spec.type), 1)[0];
            await caller.create({ name: uniqueName, type: spec.type, data });
          }

          const list = await caller.list({});

          // Verify each item in the list
          for (const item of list) {
            // Should have metadata fields
            const hasMetadata =
              typeof item.id === "string" &&
              typeof item.name === "string" &&
              typeof item.type === "string" &&
              item.createdAt instanceof Date &&
              item.updatedAt instanceof Date;

            // Should NOT have sensitive fields
            const noSensitiveData =
              !("encryptedData" in item) &&
              !("iv" in item) &&
              !("authTag" in item) &&
              !("data" in item) &&
              !("apiKey" in item) &&
              !("password" in item) &&
              !("token" in item) &&
              !("clientSecret" in item);

            if (!hasMetadata || !noSensitiveData) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: secure-credentials, Property 4: Duplicate Name Rejection**
   * *For any* user with an existing credential of name N, attempting to create
   * another credential with name N SHALL result in a validation error.
   * **Validates: Requirements 1.4**
   */
  it("Property 4: Duplicate credential names are rejected for the same user", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        credentialNameArb,
        credentialTypeArb,
        credentialTypeArb,
        async (userId, name, type1, type2) => {
          // Clear mock data for this iteration
          mockCredentials.clear();

          const caller = createTestCaller(userId);
          const data1 = fc.sample(credentialDataForType(type1), 1)[0];
          const data2 = fc.sample(credentialDataForType(type2), 1)[0];

          // Create first credential
          await caller.create({ name, type: type1, data: data1 });

          // Attempt to create second credential with same name
          try {
            await caller.create({ name, type: type2, data: data2 });
            return false; // Should have thrown
          } catch (error: any) {
            return error.code === "CONFLICT";
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: secure-credentials, Property 5: Update Re-encryption**
   * *For any* credential update with new data, the stored encryptedData, iv,
   * and authTag SHALL differ from the previous values.
   * **Validates: Requirements 2.1**
   */
  it("Property 5: Updating credential data produces new encryption values", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        credentialNameArb,
        credentialTypeArb,
        async (userId, name, type) => {
          // Clear mock data for this iteration
          mockCredentials.clear();

          const caller = createTestCaller(userId);
          const data1 = fc.sample(credentialDataForType(type), 1)[0];
          const data2 = fc.sample(credentialDataForType(type), 1)[0];

          // Create credential
          const created = await caller.create({ name, type, data: data1 });

          // Get original encryption values
          const originalStored = mockCredentials.get(created.id);
          const originalIv = originalStored.iv;

          // Update with new data
          await caller.update({ id: created.id, data: data2 });

          // Get updated encryption values
          const updatedStored = mockCredentials.get(created.id);

          // IV should always be different (random generation)
          return updatedStored.iv !== originalIv;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: secure-credentials, Property 7: Deletion Completeness**
   * *For any* deleted credential, querying for that credential by ID
   * SHALL return not found.
   * **Validates: Requirements 2.3**
   */
  it("Property 7: Deleted credentials cannot be retrieved", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        credentialNameArb,
        credentialTypeArb,
        async (userId, name, type) => {
          // Clear mock data for this iteration
          mockCredentials.clear();

          const caller = createTestCaller(userId);
          const data = fc.sample(credentialDataForType(type), 1)[0];

          // Create credential
          const created = await caller.create({ name, type, data });
          const credentialId = created.id;

          // Delete credential
          await caller.delete({ id: credentialId });

          // Attempt to retrieve deleted credential
          try {
            await caller.getById({ id: credentialId });
            return false; // Should have thrown
          } catch (error: any) {
            return error.code === "NOT_FOUND";
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: secure-credentials, Property 6: Authorization Enforcement**
   * *For any* credential owned by user A, user B (where A ≠ B) attempting to
   * read, update, or delete the credential SHALL receive an authorization error.
   * **Validates: Requirements 2.4**
   */
  it("Property 6: Users cannot access other users' credentials", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        userIdArb.filter((id) => id.length > 0),
        credentialNameArb,
        credentialTypeArb,
        fc.constantFrom("getById", "update", "delete", "getDecrypted"),
        async (userA, userB, name, type, operation) => {
          // Ensure users are different
          if (userA === userB) return true; // Skip if same user

          // Clear mock data for this iteration
          mockCredentials.clear();

          const callerA = createTestCaller(userA);
          const callerB = createTestCaller(userB);
          const data = fc.sample(credentialDataForType(type), 1)[0];

          // User A creates a credential
          const created = await callerA.create({ name, type, data });

          // User B attempts to access the credential
          try {
            switch (operation) {
              case "getById":
                await callerB.getById({ id: created.id });
                break;
              case "update":
                await callerB.update({ id: created.id, name: "New Name" });
                break;
              case "delete":
                await callerB.delete({ id: created.id });
                break;
              case "getDecrypted":
                await callerB.getDecrypted({ id: created.id });
                break;
            }
            return false; // Should have thrown FORBIDDEN
          } catch (error: any) {
            return error.code === "FORBIDDEN";
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: secure-credentials, Property 13: Audit Log Completeness**
   * *For any* credential operation (create, update, delete, access), an audit log
   * entry SHALL be created containing timestamp, userId, credentialId, and action
   * type, but SHALL NOT contain credential data.
   * **Validates: Requirements 7.1, 7.2, 7.3**
   */
  it("Property 13: All credential operations create audit log entries without credential data", async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        credentialNameArb,
        credentialTypeArb,
        async (userId, name, type) => {
          // Clear mock data for this iteration
          mockCredentials.clear();
          mockCredentialLogs.length = 0;

          const caller = createTestCaller(userId);
          const data = fc.sample(credentialDataForType(type), 1)[0];

          // Create credential - should log "create"
          const created = await caller.create({ name, type, data });

          // Update credential - should log "update"
          const newData = fc.sample(credentialDataForType(type), 1)[0];
          await caller.update({ id: created.id, data: newData });

          // Delete credential - should log "delete"
          await caller.delete({ id: created.id });

          // Verify audit logs
          const createLog = mockCredentialLogs.find(
            (log) => log.credentialId === created.id && log.action === "create"
          );
          const updateLog = mockCredentialLogs.find(
            (log) => log.credentialId === created.id && log.action === "update"
          );
          const deleteLog = mockCredentialLogs.find(
            (log) => log.credentialId === created.id && log.action === "delete"
          );

          // All operations should have created logs
          if (!createLog || !updateLog || !deleteLog) {
            return false;
          }

          // Verify each log has required fields
          for (const log of [createLog, updateLog, deleteLog]) {
            // Must have required fields
            const hasRequiredFields =
              typeof log.id === "string" &&
              typeof log.credentialId === "string" &&
              typeof log.userId === "string" &&
              typeof log.action === "string" &&
              log.timestamp instanceof Date;

            // Must NOT have credential data
            const noCredentialData =
              !("encryptedData" in log) &&
              !("iv" in log) &&
              !("authTag" in log) &&
              !("data" in log) &&
              !("apiKey" in log) &&
              !("password" in log) &&
              !("token" in log) &&
              !("clientSecret" in log);

            // userId must match
            const correctUserId = log.userId === userId;

            if (!hasRequiredFields || !noCredentialData || !correctUserId) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Credentials Router Unit Tests", () => {
  it("should create a credential successfully", async () => {
    const caller = createTestCaller("user-123");
    const input = {
      name: "My API Key",
      type: CredentialType.API_KEY,
      data: { apiKey: "sk-test-key" },
    };

    const result = await caller.create(input);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(input.name);
    expect(result.type).toBe(input.type);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should list credentials for a user", async () => {
    const caller = createTestCaller("user-123");

    await caller.create({
      name: "Cred 1",
      type: CredentialType.API_KEY,
      data: { apiKey: "key1" },
    });

    await caller.create({
      name: "Cred 2",
      type: CredentialType.BEARER_TOKEN,
      data: { token: "token1" },
    });

    const list = await caller.list({});

    expect(list.length).toBe(2);
    expect(list.every((c) => c.id && c.name && c.type)).toBe(true);
  });

  it("should decrypt credential data correctly", async () => {
    const caller = createTestCaller("user-123");
    const originalData = { apiKey: "sk-secret-key-12345" };

    const created = await caller.create({
      name: "Test Cred",
      type: CredentialType.API_KEY,
      data: originalData,
    });

    const decrypted = await caller.getDecrypted({ id: created.id });

    expect(decrypted.data).toEqual(originalData);
  });

  it("should throw NOT_FOUND for non-existent credential", async () => {
    const caller = createTestCaller("user-123");

    await expect(caller.getById({ id: "non-existent-id" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("should throw FORBIDDEN when accessing another user's credential", async () => {
    const caller1 = createTestCaller("user-1");
    const caller2 = createTestCaller("user-2");

    const created = await caller1.create({
      name: "User 1 Cred",
      type: CredentialType.API_KEY,
      data: { apiKey: "key" },
    });

    await expect(caller2.getById({ id: created.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("should update credential name", async () => {
    const caller = createTestCaller("user-123");

    const created = await caller.create({
      name: "Original Name",
      type: CredentialType.API_KEY,
      data: { apiKey: "key" },
    });

    const updated = await caller.update({
      id: created.id,
      name: "New Name",
    });

    expect(updated.name).toBe("New Name");
  });

  it("should delete credential", async () => {
    const caller = createTestCaller("user-123");

    const created = await caller.create({
      name: "To Delete",
      type: CredentialType.API_KEY,
      data: { apiKey: "key" },
    });

    await caller.delete({ id: created.id });

    await expect(caller.getById({ id: created.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  /**
   * Test for credential deletion cascading (Requirements: 2.5)
   * When a credential is deleted, all node references to that credential should be cleared
   */
  it("should clear credential references from nodes when credential is deleted", async () => {
    const userId = "user-123";
    const caller = createTestCaller(userId);

    // Create a credential
    const created = await caller.create({
      name: "Node Credential",
      type: CredentialType.API_KEY,
      data: { apiKey: "key" },
    });

    // Create a workflow for the user
    const workflowId = "workflow-1";
    mockWorkflows.set(workflowId, {
      id: workflowId,
      userId,
      name: "Test Workflow",
    });

    // Create nodes that reference the credential
    const node1Id = "node-1";
    const node2Id = "node-2";
    const node3Id = "node-3"; // This node doesn't reference the credential

    mockNodes.set(node1Id, {
      id: node1Id,
      workflowId,
      name: "HTTP Request",
      type: "http_request",
      data: {
        url: "https://api.example.com",
        credentialId: created.id,
        credentialType: CredentialType.API_KEY,
      },
    });

    mockNodes.set(node2Id, {
      id: node2Id,
      workflowId,
      name: "AI Agent",
      type: "ai_agent",
      data: {
        model: "gpt-4",
        credentialId: created.id,
        credentialType: CredentialType.API_KEY,
      },
    });

    mockNodes.set(node3Id, {
      id: node3Id,
      workflowId,
      name: "Manual Trigger",
      type: "manual_trigger",
      data: {
        someConfig: "value",
      },
    });

    // Delete the credential
    await caller.delete({ id: created.id });

    // Verify node references were cleared
    const node1 = mockNodes.get(node1Id);
    const node2 = mockNodes.get(node2Id);
    const node3 = mockNodes.get(node3Id);

    // Nodes that referenced the credential should have credentialId and credentialType removed
    expect(node1.data.credentialId).toBeUndefined();
    expect(node1.data.credentialType).toBeUndefined();
    expect(node1.data.url).toBe("https://api.example.com"); // Other data preserved

    expect(node2.data.credentialId).toBeUndefined();
    expect(node2.data.credentialType).toBeUndefined();
    expect(node2.data.model).toBe("gpt-4"); // Other data preserved

    // Node that didn't reference the credential should be unchanged
    expect(node3.data.someConfig).toBe("value");
    expect(node3.data.credentialId).toBeUndefined();
  });

  /**
   * Test that credential deletion only affects nodes in user's own workflows
   */
  it("should only clear credential references from user's own workflows", async () => {
    const userId1 = "user-1";
    const userId2 = "user-2";
    const caller1 = createTestCaller(userId1);

    // Create a credential for user 1
    const created = await caller1.create({
      name: "User 1 Credential",
      type: CredentialType.API_KEY,
      data: { apiKey: "key" },
    });

    // Create workflows for both users
    const workflow1Id = "workflow-user1";
    const workflow2Id = "workflow-user2";

    mockWorkflows.set(workflow1Id, {
      id: workflow1Id,
      userId: userId1,
      name: "User 1 Workflow",
    });

    mockWorkflows.set(workflow2Id, {
      id: workflow2Id,
      userId: userId2,
      name: "User 2 Workflow",
    });

    // Create nodes in both workflows (hypothetically user 2's node has same credentialId)
    const node1Id = "node-user1";
    const node2Id = "node-user2";

    mockNodes.set(node1Id, {
      id: node1Id,
      workflowId: workflow1Id,
      name: "User 1 Node",
      type: "http_request",
      data: {
        credentialId: created.id,
        credentialType: CredentialType.API_KEY,
      },
    });

    mockNodes.set(node2Id, {
      id: node2Id,
      workflowId: workflow2Id,
      name: "User 2 Node",
      type: "http_request",
      data: {
        credentialId: created.id, // Same credential ID (shouldn't happen in practice)
        credentialType: CredentialType.API_KEY,
      },
    });

    // Delete the credential
    await caller1.delete({ id: created.id });

    // User 1's node should have credential reference cleared
    const node1 = mockNodes.get(node1Id);
    expect(node1.data.credentialId).toBeUndefined();
    expect(node1.data.credentialType).toBeUndefined();

    // User 2's node should be unchanged (not in user 1's workflows)
    const node2 = mockNodes.get(node2Id);
    expect(node2.data.credentialId).toBe(created.id);
    expect(node2.data.credentialType).toBe(CredentialType.API_KEY);
  });
});
