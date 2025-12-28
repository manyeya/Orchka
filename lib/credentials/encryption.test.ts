import { describe, it, expect, beforeAll } from "vitest";
import * as fc from "fast-check";
import { encrypt, decrypt, validateMasterKey } from "./encryption";

// Set up test encryption key before tests run
beforeAll(() => {
  // Use a valid 64-character hex key for testing
  process.env.CREDENTIAL_ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

describe("Encryption Service Property Tests", () => {
  /**
   * **Feature: secure-credentials, Property 1: Encryption Round-Trip Consistency**
   * *For any* valid credential data object, encrypting then decrypting the data
   * SHALL produce an identical object to the original input.
   * **Validates: Requirements 1.1, 3.3, 5.3, 5.4**
   */
  it("Property 1: Encryption round-trip produces identical output", () => {
    fc.assert(
      fc.property(fc.string(), (plaintext) => {
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(
          encrypted.encryptedData,
          encrypted.iv,
          encrypted.authTag
        );
        return decrypted === plaintext;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: secure-credentials, Property 1: Encryption Round-Trip Consistency**
   * Additional test with JSON objects (credential data is typically JSON)
   * **Validates: Requirements 1.1, 3.3, 5.3, 5.4**
   */
  it("Property 1: Encryption round-trip works with JSON credential data", () => {
    const credentialDataArb = fc.record({
      apiKey: fc.string(),
      username: fc.option(fc.string(), { nil: undefined }),
      password: fc.option(fc.string(), { nil: undefined }),
      token: fc.option(fc.string(), { nil: undefined }),
    });

    fc.assert(
      fc.property(credentialDataArb, (credentialData) => {
        const jsonString = JSON.stringify(credentialData);
        const encrypted = encrypt(jsonString);
        const decrypted = decrypt(
          encrypted.encryptedData,
          encrypted.iv,
          encrypted.authTag
        );
        const parsed = JSON.parse(decrypted);
        return JSON.stringify(parsed) === jsonString;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: secure-credentials, Property 10: IV Uniqueness**
   * *For any* set of encrypted credentials, all initialization vectors SHALL be unique.
   * **Validates: Requirements 4.2**
   */
  it("Property 10: Each encryption generates a unique IV", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 2, maxLength: 50 }),
        (plaintexts) => {
          const ivs = plaintexts.map((pt) => encrypt(pt).iv);
          const uniqueIvs = new Set(ivs);
          return uniqueIvs.size === ivs.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: secure-credentials, Property 10: IV Uniqueness**
   * Even encrypting the same plaintext multiple times should produce unique IVs
   * **Validates: Requirements 4.2**
   */
  it("Property 10: Same plaintext encrypted multiple times produces unique IVs", () => {
    fc.assert(
      fc.property(fc.string(), fc.integer({ min: 2, max: 20 }), (plaintext, count) => {
        const ivs: string[] = [];
        for (let i = 0; i < count; i++) {
          ivs.push(encrypt(plaintext).iv);
        }
        const uniqueIvs = new Set(ivs);
        return uniqueIvs.size === ivs.length;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: secure-credentials, Property 11: Tamper Detection**
   * *For any* encrypted credential where the ciphertext or authTag has been modified,
   * decryption SHALL fail with an authentication error.
   * **Validates: Requirements 4.5**
   */
  it("Property 11: Tampered ciphertext is detected", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.integer({ min: 0 }),
        (plaintext, tamperIndex) => {
          const encrypted = encrypt(plaintext);
          
          // Tamper with the encrypted data
          const encryptedBytes = Buffer.from(encrypted.encryptedData, "base64");
          if (encryptedBytes.length === 0) return true; // Skip empty ciphertext
          
          const idx = tamperIndex % encryptedBytes.length;
          encryptedBytes[idx] = (encryptedBytes[idx] + 1) % 256;
          const tamperedData = encryptedBytes.toString("base64");

          try {
            decrypt(tamperedData, encrypted.iv, encrypted.authTag);
            return false; // Should have thrown
          } catch (error) {
            return true; // Expected: decryption failed due to tampering
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: secure-credentials, Property 11: Tamper Detection**
   * Tampering with the auth tag should also be detected
   * **Validates: Requirements 4.5**
   */
  it("Property 11: Tampered auth tag is detected", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.integer({ min: 0 }),
        (plaintext, tamperIndex) => {
          const encrypted = encrypt(plaintext);

          // Tamper with the auth tag
          const authTagBytes = Buffer.from(encrypted.authTag, "base64");
          const idx = tamperIndex % authTagBytes.length;
          authTagBytes[idx] = (authTagBytes[idx] + 1) % 256;
          const tamperedAuthTag = authTagBytes.toString("base64");

          try {
            decrypt(encrypted.encryptedData, encrypted.iv, tamperedAuthTag);
            return false; // Should have thrown
          } catch (error) {
            return true; // Expected: decryption failed due to tampering
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: secure-credentials, Property 11: Tamper Detection**
   * Tampering with the IV should also cause decryption to fail or produce wrong output
   * **Validates: Requirements 4.5**
   */
  it("Property 11: Tampered IV causes decryption failure or wrong output", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.integer({ min: 0 }),
        (plaintext, tamperIndex) => {
          const encrypted = encrypt(plaintext);

          // Tamper with the IV
          const ivBytes = Buffer.from(encrypted.iv, "base64");
          const idx = tamperIndex % ivBytes.length;
          ivBytes[idx] = (ivBytes[idx] + 1) % 256;
          const tamperedIv = ivBytes.toString("base64");

          try {
            const result = decrypt(encrypted.encryptedData, tamperedIv, encrypted.authTag);
            // If decryption succeeds, the result should be different from original
            return result !== plaintext;
          } catch (error) {
            return true; // Expected: decryption failed due to tampering
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Encryption Service Unit Tests", () => {
  it("should validate master key successfully", () => {
    expect(validateMasterKey()).toBe(true);
  });

  it("should throw error when master key is missing", () => {
    const originalKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
    delete process.env.CREDENTIAL_ENCRYPTION_KEY;

    expect(() => encrypt("test")).toThrow("CREDENTIAL_ENCRYPTION_KEY environment variable is not set");

    process.env.CREDENTIAL_ENCRYPTION_KEY = originalKey;
  });

  it("should throw error when master key has wrong length", () => {
    const originalKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
    process.env.CREDENTIAL_ENCRYPTION_KEY = "tooshort";

    expect(() => encrypt("test")).toThrow("must be a 64-character hex string");

    process.env.CREDENTIAL_ENCRYPTION_KEY = originalKey;
  });

  it("should throw error when master key has invalid characters", () => {
    const originalKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
    process.env.CREDENTIAL_ENCRYPTION_KEY =
      "ghijklmnopqrstuvwxyz0123456789abcdef0123456789abcdef0123456789ab";

    expect(() => encrypt("test")).toThrow("must contain only hexadecimal characters");

    process.env.CREDENTIAL_ENCRYPTION_KEY = originalKey;
  });
});
