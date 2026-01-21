import InitialNode from "@/features/nodes/utils/initial-node";
import { ManualTriggerNode } from "@/features/nodes/trigger/manual/manual-trigger-node";
import { HttpRequestNode } from "@/features/nodes/action/https-request/node";
import { AIAgentNode } from "@/features/nodes/ai/ai-agent/node";
import { AIGenerateNode } from "@/features/nodes/ai/ai-generate/node";
import { AIExtractNode } from "@/features/nodes/ai/ai-extract/node";
import { AIClassifyNode } from "@/features/nodes/ai/ai-classify/node";
import { AIAgentExpNode } from "@/features/nodes/ai/ai-agent-exp/node";
import { IfNode } from "@/features/nodes/control/if/node";
import { SwitchNode } from "@/features/nodes/control/switch/node";
import { LoopNode } from "@/features/nodes/control/loop/node";
import { WaitNode } from "@/features/nodes/control/wait/node";
import GroupNode from "@/features/nodes/tools/group-node";
import AnnotationNode from "@/features/nodes/tools/annotation-node";
import type { NodeTypes } from "@xyflow/react";

// Re-export node required fields for backward compatibility
export { NODE_REQUIRED_FIELDS, DEFAULT_REQUIRED_FIELDS } from "./node-required-fields";

export enum NodeType {
    INITIAL = 'INITIAL',
    MANUAL_TRIGGER = 'MANUAL_TRIGGER',
    HTTP_REQUEST = 'HTTP_REQUEST',
    AI_AGENT = 'AI_AGENT',
    AI_GENERATE = 'AI_GENERATE',
    AI_EXTRACT = 'AI_EXTRACT',
    AI_CLASSIFY = 'AI_CLASSIFY',
    AI_AGENT_EXP = 'AI_AGENT_EXP',
    IF_CONDITION = 'IF_CONDITION',
    SWITCH = 'SWITCH',
    LOOP = 'LOOP',
    WAIT = 'WAIT',
    GROUP = 'GROUP',
    ANNOTATION = 'ANNOTATION'
}

export const NODE_COMPONENTS = {
    [NodeType.INITIAL]: InitialNode,
    [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
    [NodeType.HTTP_REQUEST]: HttpRequestNode,
    [NodeType.AI_AGENT]: AIAgentNode,
    [NodeType.AI_GENERATE]: AIGenerateNode,
    [NodeType.AI_EXTRACT]: AIExtractNode,
    [NodeType.AI_CLASSIFY]: AIClassifyNode,
    [NodeType.AI_AGENT_EXP]: AIAgentExpNode,
    [NodeType.IF_CONDITION]: IfNode,
    [NodeType.SWITCH]: SwitchNode,
    [NodeType.LOOP]: LoopNode,
    [NodeType.WAIT]: WaitNode,
    [NodeType.GROUP]: GroupNode,
    [NodeType.ANNOTATION]: AnnotationNode,
} as const satisfies NodeTypes

export type RegisteredNodeType = keyof typeof NODE_COMPONENTS