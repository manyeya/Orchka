import type { ExpressionContext } from "@orchka/expression-engine";
import type { DecryptedCredential } from "@orchka/credentials-core";

export type WorkflowContext = Record<string, unknown>;

export type CredentialResolver = (credentialId: string) => Promise<DecryptedCredential>;

export interface NodeStatusPayload {
  nodeId: string;
  status: "loading" | "success" | "error" | "idle";
  nodeType?: string;
  metadata?: Record<string, unknown>;
}

export interface NodeDataPayload {
  nodeId: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  nodeType: string;
  iteration?: { index: number; total: number };
}

export type PublishFn = (payload: NodeDataPayload | NodeStatusPayload) => Promise<void>;

export interface NodeExecutorParams<TData = Record<string, unknown>> {
  data: TData;
  nodeId: string;
  context: WorkflowContext;
  expressionContext?: ExpressionContext;
  publish: PublishFn;
  resolveCredential?: CredentialResolver;
}

export type NodeExecutor<TData = Record<string, unknown>> = (
  params: NodeExecutorParams<TData>
) => Promise<WorkflowContext>;

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
