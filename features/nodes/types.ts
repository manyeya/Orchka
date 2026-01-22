export const NodeType = {
    INITIAL: "INITIAL",
    MANUAL_TRIGGER: "MANUAL_TRIGGER",
    CRON_TRIGGER: "CRON_TRIGGER",
    HTTP_REQUEST: "HTTP_REQUEST",
    IF_CONDITION: "IF_CONDITION",
    SWITCH: "SWITCH",
    LOOP: "LOOP",
    WAIT: "WAIT",
    AI_AGENT: "AI_AGENT",
    AI_GENERATE: "AI_GENERATE",
    AI_EXTRACT: "AI_EXTRACT",
    AI_CLASSIFY: "AI_CLASSIFY",
    AI_AGENT_EXP: "AI_AGENT_EXP",
    GROUP: "GROUP",
    ANNOTATION: "ANNOTATION",
} as const;

export type NodeType = string;

/**
 * List of all trigger node types.
 * Add new trigger types here to automatically enable execution button and other trigger-specific behavior.
 */
export const TRIGGER_NODE_TYPES: string[] = [
    NodeType.MANUAL_TRIGGER,
    NodeType.CRON_TRIGGER,
];

/**
 * Check if a node type is a trigger node.
 */
export const isTriggerNode = (nodeType: string): boolean => {
    return TRIGGER_NODE_TYPES.includes(nodeType);
};
