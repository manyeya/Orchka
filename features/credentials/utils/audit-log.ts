import prisma from "@/lib/db";

/**
 * Audit log action types for credential operations
 */
export enum AuditAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  ACCESS = "access",
}

/**
 * Input for creating an audit log entry
 * Note: Credential data is intentionally excluded to prevent sensitive data in logs
 * Requirements: 7.3
 */
export interface AuditLogInput {
  credentialId: string;
  userId: string;
  action: AuditAction;
  workflowId?: string;
}

/**
 * Audit log entry returned from queries
 */
export interface AuditLogEntry {
  id: string;
  credentialId: string;
  userId: string;
  workflowId: string | null;
  action: string;
  timestamp: Date;
}

/**
 * Log a credential operation for audit purposes.
 * This function intentionally does NOT accept any credential data
 * to ensure sensitive information is never logged.
 * 
 * Requirements: 7.1, 7.2, 7.3
 * 
 * @param input - The audit log input (without credential data)
 * @returns The created audit log entry
 */
export async function logCredentialOperation(
  input: AuditLogInput
): Promise<AuditLogEntry> {
  const entry = await prisma.credentialLog.create({
    data: {
      credentialId: input.credentialId,
      userId: input.userId,
      action: input.action,
      workflowId: input.workflowId ?? null,
    },
  });

  return {
    id: entry.id,
    credentialId: entry.credentialId,
    userId: entry.userId,
    workflowId: entry.workflowId,
    action: entry.action,
    timestamp: entry.timestamp,
  };
}

/**
 * Log a credential creation event
 * Requirements: 7.2
 */
export async function logCredentialCreate(
  credentialId: string,
  userId: string
): Promise<AuditLogEntry> {
  return logCredentialOperation({
    credentialId,
    userId,
    action: AuditAction.CREATE,
  });
}

/**
 * Log a credential update event
 * Requirements: 7.2
 */
export async function logCredentialUpdate(
  credentialId: string,
  userId: string
): Promise<AuditLogEntry> {
  return logCredentialOperation({
    credentialId,
    userId,
    action: AuditAction.UPDATE,
  });
}

/**
 * Log a credential deletion event
 * Requirements: 7.2
 */
export async function logCredentialDelete(
  credentialId: string,
  userId: string
): Promise<AuditLogEntry> {
  return logCredentialOperation({
    credentialId,
    userId,
    action: AuditAction.DELETE,
  });
}

/**
 * Log a credential access event (for workflow execution)
 * Requirements: 7.1
 */
export async function logCredentialAccess(
  credentialId: string,
  userId: string,
  workflowId: string
): Promise<AuditLogEntry> {
  return logCredentialOperation({
    credentialId,
    userId,
    action: AuditAction.ACCESS,
    workflowId,
  });
}

/**
 * Get audit logs for a specific credential
 * Useful for security auditing
 */
export async function getAuditLogsForCredential(
  credentialId: string
): Promise<AuditLogEntry[]> {
  const logs = await prisma.credentialLog.findMany({
    where: { credentialId },
    orderBy: { timestamp: "desc" },
  });

  return logs.map((log) => ({
    id: log.id,
    credentialId: log.credentialId,
    userId: log.userId,
    workflowId: log.workflowId,
    action: log.action,
    timestamp: log.timestamp,
  }));
}

/**
 * Get audit logs for a specific user
 * Useful for user activity auditing
 */
export async function getAuditLogsForUser(
  userId: string
): Promise<AuditLogEntry[]> {
  const logs = await prisma.credentialLog.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
  });

  return logs.map((log) => ({
    id: log.id,
    credentialId: log.credentialId,
    userId: log.userId,
    workflowId: log.workflowId,
    action: log.action,
    timestamp: log.timestamp,
  }));
}
