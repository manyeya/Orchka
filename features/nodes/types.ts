export const NodeType = {
    INITIAL: "INITIAL",
    MANUAL_TRIGGER: "MANUAL_TRIGGER",
    HTTP_REQUEST: "HTTP_REQUEST",
    IF_CONDITION: "IF_CONDITION",
    SWITCH: "SWITCH",
    LOOP: "LOOP",
    WAIT: "WAIT",
    AI_AGENT: "AI_AGENT",
} as const;

export type NodeType = string;
