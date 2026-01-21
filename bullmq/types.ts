import type { ExpressionContext } from "@/features/editor/utils/expression-engine/index";
import type { DecryptedCredential } from "@/lib/credentials/execution";

export type WorkflowContext = Record<string, unknown>;
export type CredentialResolver = (credentialId: string) => Promise<DecryptedCredential>;

export type StepTools = {
    run: (name: string, fn: () => Promise<any>) => Promise<any>;
    sleep: (name: string, durationMs: number) => Promise<void>;
    sleepUntil: (name: string, date: Date) => Promise<void>;
};

export interface NodeExecutorParams<TData = Record<string, unknown>> {
    data: TData;
    nodeId: string;
    context: WorkflowContext;
    expressionContext?: ExpressionContext;
    publish: PublishFn;
    resolveCredential?: CredentialResolver;
    step?: StepTools;
}

export type NodeExecutor<TData = Record<string, unknown>>
    = (params: NodeExecutorParams<TData>) => Promise<WorkflowContext>;

export type PublishFn = (payload: {
    nodeId: string;
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
    nodeType: string;
    iteration?: { index: number; total: number };
}) => Promise<void>;

export interface BranchDecision {
    branch: string;
    data?: unknown;
    iteration?: {
        index: number;
        total: number;
        item: unknown;
    };
}

export interface ControlNodeResult {
    context: WorkflowContext;
    branchDecision?: BranchDecision;
}
