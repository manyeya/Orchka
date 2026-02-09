import { NodeType } from "./types";
import type { NodeExecutor } from "./executor-types";

// Placeholder executors - will be replaced as nodes are migrated
const placeholderExecutor = (): Promise<Record<string, unknown>> => Promise.resolve({});

export const executorsRegistry: Record<NodeType, NodeExecutor<any>> = {
    [NodeType.INITIAL]: placeholderExecutor,
    [NodeType.MANUAL_TRIGGER]: placeholderExecutor,
    [NodeType.CRON_TRIGGER]: placeholderExecutor,
    [NodeType.HTTP_REQUEST]: placeholderExecutor,
    [NodeType.AI_AGENT]: placeholderExecutor,
    [NodeType.AI_GENERATE]: placeholderExecutor,
    [NodeType.AI_EXTRACT]: placeholderExecutor,
    [NodeType.AI_CLASSIFY]: placeholderExecutor,
    [NodeType.AI_AGENT_EXP]: placeholderExecutor,
    [NodeType.IF_CONDITION]: placeholderExecutor,
    [NodeType.SWITCH]: placeholderExecutor,
    [NodeType.LOOP]: placeholderExecutor,
    [NodeType.WAIT]: placeholderExecutor,
    [NodeType.MERGE]: placeholderExecutor,
    [NodeType.GROUP]: placeholderExecutor,
    [NodeType.ANNOTATION]: placeholderExecutor,
};

export const getExecutor = (type: NodeType): NodeExecutor<any> => {
    const executor = executorsRegistry[type];
    if (!executor) {
        throw new Error(`Executor not found for node type ${type}`);
    }
    return executor;
};

export const registerExecutor = (type: NodeType, executor: NodeExecutor<any>): void => {
    executorsRegistry[type] = executor;
};
