import type { ExpressionContext } from "@/features/editor/utils/expression-engine/index";
import type { Realtime } from "@inngest/realtime";
import { GetStepTools, Inngest } from "inngest";
import type { DecryptedCredential } from "@/lib/credentials/execution";

export type WorkflowContext = Record<string, unknown>;
export type WorkflowStepTools = GetStepTools<Inngest.Any>;

/**
 * Function type for resolving credentials during workflow execution
 * Requirements: 3.3
 */
export type CredentialResolver = (
    credentialId: string
) => Promise<DecryptedCredential>;

export interface NodeExecutorParams<TData = Record<string, unknown>> {
    data: TData;
    nodeId: string;
    context: WorkflowContext;
    step: WorkflowStepTools;
    /** Expression context for evaluating dynamic expressions in node data */
    expressionContext?: ExpressionContext;
    publish: Realtime.PublishFn;
    /** 
     * Function to resolve credentials during execution
     * Requirements: 3.3
     */
    resolveCredential?: CredentialResolver;
}

export type NodeExecutor<TData = Record<string, unknown>>
    = (params: NodeExecutorParams<TData>) => Promise<WorkflowContext>;

/** Result from control node execution indicating which branch to take */
export interface BranchDecision {
    /** The output handle ID to follow (e.g., "true", "false", "case-1", "default", "loop", "done") */
    branch: string;
    /** Optional data to pass to the branch */
    data?: unknown;
    /** For loop nodes: iteration context */
    iteration?: {
        index: number;
        total: number;
        item: unknown;
    };
}

/** Extended executor result for control nodes */
export interface ControlNodeResult {
    context: WorkflowContext;
    branchDecision?: BranchDecision;
}