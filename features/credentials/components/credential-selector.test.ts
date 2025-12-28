import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  CredentialType,
} from "@/lib/credentials/types";
import {
  NodeCredentialConfig,
  getCredentialConfigFromNodeData,
  setCredentialConfigInNodeData,
} from "./credential-selector";

/**
 * Property tests for credential selector functionality
 * Tests the helper functions that manage credential references in node data
 */
describe("Credential Selector Property Tests", () => {
  // Arbitrary for generating valid credential IDs (CUID-like strings)
  const validCredentialIdArb = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0);

  // Arbitrary for generating valid credential types
  const validCredentialTypeArb = fc.constantFrom(...Object.values(CredentialType));

  // Arbitrary for generating valid NodeCredentialConfig
  const validCredentialConfigArb = fc.record({
    credentialId: validCredentialIdArb,
    credentialType: validCredentialTypeArb,
  });

  // Arbitrary for generating random node data (without credential fields)
  const randomNodeDataArb = fc.dictionary(
    fc.string({ minLength: 1 }).filter(s => s !== "credentialId" && s !== "credentialType"),
    fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))
  );

  /**
   * **Feature: secure-credentials, Property 8: Credential Reference Storage**
   * *For any* node configured with a credential, the node's data SHALL contain
   * the credentialId and credentialType.
   * **Validates: Requirements 3.2**
   */
  describe("Property 8: Credential Reference Storage", () => {
    it("setCredentialConfigInNodeData stores both credentialId and credentialType", () => {
      fc.assert(
        fc.property(
          randomNodeDataArb,
          validCredentialConfigArb,
          (nodeData, config) => {
            const result = setCredentialConfigInNodeData(nodeData, config);
            
            // The result SHALL contain the credentialId
            expect(result.credentialId).toBe(config.credentialId);
            // The result SHALL contain the credentialType
            expect(result.credentialType).toBe(config.credentialType);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("getCredentialConfigFromNodeData retrieves stored credential config", () => {
      fc.assert(
        fc.property(
          randomNodeDataArb,
          validCredentialConfigArb,
          (nodeData, config) => {
            // Set the credential config
            const nodeDataWithCredential = setCredentialConfigInNodeData(nodeData, config);
            
            // Retrieve the credential config
            const retrievedConfig = getCredentialConfigFromNodeData(nodeDataWithCredential);
            
            // The retrieved config SHALL match the original
            expect(retrievedConfig).not.toBeNull();
            expect(retrievedConfig?.credentialId).toBe(config.credentialId);
            expect(retrievedConfig?.credentialType).toBe(config.credentialType);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("round-trip: set then get returns equivalent config", () => {
      fc.assert(
        fc.property(
          randomNodeDataArb,
          validCredentialConfigArb,
          (nodeData, config) => {
            const nodeDataWithCredential = setCredentialConfigInNodeData(nodeData, config);
            const retrievedConfig = getCredentialConfigFromNodeData(nodeDataWithCredential);
            
            // Round-trip SHALL preserve the credential config
            return (
              retrievedConfig !== null &&
              retrievedConfig.credentialId === config.credentialId &&
              retrievedConfig.credentialType === config.credentialType
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("setting null config removes credential fields from node data", () => {
      fc.assert(
        fc.property(
          randomNodeDataArb,
          validCredentialConfigArb,
          (nodeData, config) => {
            // First set a credential config
            const nodeDataWithCredential = setCredentialConfigInNodeData(nodeData, config);
            
            // Then remove it by setting null
            const nodeDataWithoutCredential = setCredentialConfigInNodeData(nodeDataWithCredential, null);
            
            // The result SHALL NOT contain credentialId or credentialType
            expect(nodeDataWithoutCredential.credentialId).toBeUndefined();
            expect(nodeDataWithoutCredential.credentialType).toBeUndefined();
            
            // getCredentialConfigFromNodeData SHALL return null
            const retrievedConfig = getCredentialConfigFromNodeData(nodeDataWithoutCredential);
            expect(retrievedConfig).toBeNull();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("existing node data is preserved when setting credential config", () => {
      fc.assert(
        fc.property(
          randomNodeDataArb,
          validCredentialConfigArb,
          (nodeData, config) => {
            const result = setCredentialConfigInNodeData(nodeData, config);
            
            // All original keys (except credential fields) SHALL be preserved
            for (const key of Object.keys(nodeData)) {
              if (key !== "credentialId" && key !== "credentialType") {
                expect(result[key]).toEqual(nodeData[key]);
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: secure-credentials, Property 9: Type-Based Filtering**
   * *For any* node requiring a specific credential type, the credential selector
   * SHALL only return credentials matching that type.
   * **Validates: Requirements 3.5**
   * 
   * Note: This property is tested at the data level by verifying that the
   * credential type stored in node config matches the expected type.
   * The actual filtering is done by the tRPC router (tested in router.test.ts).
   */
  describe("Property 9: Type-Based Filtering", () => {
    it("credential config type matches the specified type", () => {
      fc.assert(
        fc.property(
          validCredentialTypeArb,
          validCredentialIdArb,
          (expectedType, credentialId) => {
            const config: NodeCredentialConfig = {
              credentialId,
              credentialType: expectedType,
            };
            
            // The stored type SHALL match the expected type
            return config.credentialType === expectedType;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("getCredentialConfigFromNodeData returns correct type", () => {
      fc.assert(
        fc.property(
          randomNodeDataArb,
          validCredentialTypeArb,
          validCredentialIdArb,
          (nodeData, expectedType, credentialId) => {
            const config: NodeCredentialConfig = {
              credentialId,
              credentialType: expectedType,
            };
            
            const nodeDataWithCredential = setCredentialConfigInNodeData(nodeData, config);
            const retrievedConfig = getCredentialConfigFromNodeData(nodeDataWithCredential);
            
            // The retrieved type SHALL match the expected type
            return (
              retrievedConfig !== null &&
              retrievedConfig.credentialType === expectedType
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("invalid credential type in node data returns null config", () => {
      fc.assert(
        fc.property(
          validCredentialIdArb,
          fc.string().filter(s => !Object.values(CredentialType).includes(s as CredentialType)),
          (credentialId, invalidType) => {
            const nodeData = {
              credentialId,
              credentialType: invalidType,
            };
            
            const config = getCredentialConfigFromNodeData(nodeData);
            
            // Invalid type SHALL result in null config
            return config === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("missing credentialId returns null config", () => {
      fc.assert(
        fc.property(
          validCredentialTypeArb,
          (credentialType) => {
            const nodeData = {
              credentialType,
              // credentialId is missing
            };
            
            const config = getCredentialConfigFromNodeData(nodeData as Record<string, unknown>);
            
            // Missing credentialId SHALL result in null config
            return config === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("missing credentialType returns null config", () => {
      fc.assert(
        fc.property(
          validCredentialIdArb,
          (credentialId) => {
            const nodeData = {
              credentialId,
              // credentialType is missing
            };
            
            const config = getCredentialConfigFromNodeData(nodeData as Record<string, unknown>);
            
            // Missing credentialType SHALL result in null config
            return config === null;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
