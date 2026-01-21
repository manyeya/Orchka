import type { ExpressionContext } from "@/features/editor/utils/expression-engine/index";
import type { DecryptedCredential } from "@/lib/credentials/execution";

// ============================================================================
// Core Types
// ============================================================================

/** Context passed between nodes during workflow execution */
export type WorkflowContext = Record<string, unknown>;

/** Function to resolve credentials during workflow execution */
export type CredentialResolver = (credentialId: string) => Promise<DecryptedCredential>;

// ============================================================================
// Publish Function (replaces @inngest/realtime)
// ============================================================================

/** Payload for node status updates */
export interface NodeStatusPayload {
    nodeId: string;
    status: 'loading' | 'success' | 'error' | 'idle';
    nodeType?: string;
    metadata?: Record<string, unknown>;
}

/** Payload for node data updates */
export interface NodeDataPayload {
    nodeId: string;
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
    nodeType: string;
    iteration?: { index: number; total: number };
}

/** Function to publish realtime events (used by executors) */
export type PublishFn = (payload: NodeDataPayload | NodeStatusPayload) => Promise<void>;

// ============================================================================
// Node Executor Interface
// ============================================================================

/** Parameters passed to every node executor */
export interface NodeExecutorParams<TData = Record<string, unknown>> {
    data: TData;
    nodeId: string;
    context: WorkflowContext;
    expressionContext?: ExpressionContext;
    publish: PublishFn;
    resolveCredential?: CredentialResolver;
}

/** Node executor function signature */
export type NodeExecutor<TData = Record<string, unknown>>
    = (params: NodeExecutorParams<TData>) => Promise<WorkflowContext>;

// ============================================================================
// Control Node Types
// ============================================================================

/** Branch decision from control nodes (IF, SWITCH, LOOP, WAIT) */
export interface BranchDecision {
    branch: string;
    data?: unknown;
    iteration?: {
        index: number;
        total: number;
        item: unknown;
    };
}

/** Extended result for control nodes */
export interface ControlNodeResult {
    context: WorkflowContext;
    branchDecision?: BranchDecision;
}
