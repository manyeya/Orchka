import type { ExpressionContext } from "@/features/editor/utils/expression-engine/index";
import { GetStepTools, Inngest } from "inngest";


export type WorkflowContext = Record<string, unknown>;
export type WorkflowStepTools = GetStepTools<Inngest.Any>;
export interface NodeExecutorParams<TData = Record<string, unknown>> {
    data: TData;
    nodeId: string;
    context: WorkflowContext;
    step: WorkflowStepTools;
    /** Expression context for evaluating dynamic expressions in node data */
    expressionContext?: ExpressionContext;
}

export type NodeExecutor<TData = Record<string, unknown>>
    = (params: NodeExecutorParams<TData>) => Promise<WorkflowContext>;