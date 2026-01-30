/**
 * Workflow Error Classes
 * 
 * Shared error types for workflow execution that work with both
 * BullMQ and any other execution engine.
 */

/**
 * Error that should not be retried by the job queue.
 * Use this for validation errors, missing credentials, invalid configuration, etc.
 * 
 * In BullMQ, throwing this error will mark the job as failed without retrying.
 * Similar to Inngest's NonRetriableError.
 */
export class NonRetriableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NonRetriableError';
    }
}

/**
 * Error indicating a required credential was not found.
 */
export class CredentialNotFoundError extends NonRetriableError {
    constructor(credentialId: string) {
        super(`Credential not found: ${credentialId}. The credential may have been deleted.`);
        this.name = 'CredentialNotFoundError';
    }
}

/**
 * Error indicating invalid node configuration.
 */
export class NodeConfigurationError extends NonRetriableError {
    constructor(nodeType: string, message: string) {
        super(`${nodeType}: ${message}`);
        this.name = 'NodeConfigurationError';
    }
}
