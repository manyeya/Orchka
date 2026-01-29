/**
 * Credential resolution for workflow execution
 * Requirements: 3.3, 3.4
 */

import prisma from "@/lib/db";
import { decrypt } from "./encryption";
import { CredentialType } from "./types";
import { logCredentialAccess } from "./audit-log";

/**
 * Decrypted credential data returned during execution
 */
export interface DecryptedCredential {
  id: string;
  name: string;
  type: CredentialType;
  data: Record<string, unknown>;
}

/**
 * Error thrown when a credential is not found
 * Requirements: 3.4
 */
export class CredentialNotFoundError extends Error {
  constructor(credentialId: string) {
    super(`Credential not found: ${credentialId}`);
    this.name = "CredentialNotFoundError";
  }
}

/**
 * Error thrown when credential access is not authorized
 */
export class CredentialAccessDeniedError extends Error {
  constructor(credentialId: string) {
    super(`Not authorized to access credential: ${credentialId}`);
    this.name = "CredentialAccessDeniedError";
  }
}

/**
 * Get a decrypted credential for workflow execution context.
 * Verifies that the workflow owner matches the credential owner.
 * 
 * Requirements: 3.3, 3.4
 * - 3.3: Retrieve and decrypt credential data during workflow execution
 * - 3.4: Fail with clear error if credential does not exist
 * 
 * @param credentialId - The ID of the credential to retrieve
 * @param workflowId - The ID of the workflow requesting the credential
 * @returns The decrypted credential data
 * @throws CredentialNotFoundError if credential doesn't exist
 * @throws CredentialAccessDeniedError if workflow owner doesn't match credential owner
 */
export async function getCredentialForExecution(
  credentialId: string,
  workflowId: string
): Promise<DecryptedCredential> {
  // Fetch the credential
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    throw new CredentialNotFoundError(credentialId);
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
    throw new CredentialAccessDeniedError(credentialId);
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

/**
 * Resolve credential from node data if present.
 * Returns null if no credential is configured for the node.
 * 
 * Requirements: 3.3
 * 
 * @param nodeData - The node's configuration data
 * @param workflowId - The workflow ID for authorization
 * @returns The decrypted credential or null if not configured
 */
export async function resolveNodeCredential(
  nodeData: Record<string, unknown>,
  workflowId: string
): Promise<DecryptedCredential | null> {
  const credentialId = nodeData.credentialId;
  
  if (typeof credentialId !== "string" || !credentialId) {
    return null;
  }

  return getCredentialForExecution(credentialId, workflowId);
}
