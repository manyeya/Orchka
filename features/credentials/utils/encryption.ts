import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

export interface EncryptionResult {
  encryptedData: string; // base64 encoded ciphertext
  iv: string; // base64 encoded IV
  authTag: string; // base64 encoded auth tag
}

/**
 * Get the master encryption key from environment variables.
 * The key must be a 32-byte (256-bit) hex string (64 characters).
 */
function getMasterKey(): Buffer {
  const keyHex = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY environment variable is not set. " +
        "The application cannot start without a valid encryption key."
    );
  }

  if (keyHex.length !== 64) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
        `Current length: ${keyHex.length}`
    );
  }

  // Validate hex format
  if (!/^[0-9a-fA-F]+$/.test(keyHex)) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY must contain only hexadecimal characters (0-9, a-f, A-F)."
    );
  }

  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Generates a unique random IV for each encryption operation.
 */
export function encrypt(plaintext: string): EncryptionResult {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM.
 * Validates the authentication tag to detect tampering.
 */
export function decrypt(
  encryptedData: string,
  iv: string,
  authTag: string
): string {
  const key = getMasterKey();
  const ivBuffer = Buffer.from(iv, "base64");
  const authTagBuffer = Buffer.from(authTag, "base64");
  const encryptedBuffer = Buffer.from(encryptedData, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTagBuffer);

  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Validate that the master encryption key is properly configured.
 * Should be called on application startup.
 * Returns true if valid, throws an error if invalid.
 */
export function validateMasterKey(): boolean {
  getMasterKey();
  return true;
}

/**
 * Generate a new random encryption key for initial setup.
 * Returns a 64-character hex string suitable for CREDENTIAL_ENCRYPTION_KEY.
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
