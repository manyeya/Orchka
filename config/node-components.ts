import InitialNode from "@/features/nodes/utils/initial-node";
import { ManualTriggerNode } from "@/features/nodes/trigger/manual/manual-trigger-node";
import { HttpRequestNode } from "@/features/nodes/action/https-request/node";
import { AIAgentNode } from "@/features/nodes/ai/ai-agent/node";
import { IfNode } from "@/features/nodes/control/if/node";
import { SwitchNode } from "@/features/nodes/control/switch/node";
import { LoopNode } from "@/features/nodes/control/loop/node";
import { WaitNode } from "@/features/nodes/control/wait/node";
import GroupNode from "@/features/nodes/tools/group-node";
import AnnotationNode from "@/features/nodes/tools/annotation-node";
import type { NodeTypes } from "@xyflow/react";

export enum NodeType {
    INITIAL = 'INITIAL',
    MANUAL_TRIGGER = 'MANUAL_TRIGGER',
    HTTP_REQUEST = 'HTTP_REQUEST',
    AI_AGENT = 'AI_AGENT',
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
    [NodeType.IF_CONDITION]: IfNode,
    [NodeType.SWITCH]: SwitchNode,
    [NodeType.LOOP]: LoopNode,
    [NodeType.WAIT]: WaitNode,
    [NodeType.GROUP]: GroupNode,
    [NodeType.ANNOTATION]: AnnotationNode,
} as const satisfies NodeTypes

/**
 * Registry of required fields per node type.
 * Add new node types here with their required field names.
 * All nodes require a 'name' field by default.
 */
export const NODE_REQUIRED_FIELDS: Record<string, string[]> = {
    [NodeType.INITIAL]: [],
    [NodeType.MANUAL_TRIGGER]: ['name'],
    [NodeType.HTTP_REQUEST]: ['name', 'url'],
    [NodeType.AI_AGENT]: ['name', 'model'],
    [NodeType.IF_CONDITION]: ['name', 'condition'],
    [NodeType.SWITCH]: ['name', 'expression'],
    [NodeType.LOOP]: ['name', 'mode'],
    [NodeType.WAIT]: ['name', 'mode'],
    [NodeType.GROUP]: [],
    [NodeType.ANNOTATION]: [],
};

export const DEFAULT_REQUIRED_FIELDS = ['name'];

export type RegisteredNodeType = keyof typeof NODE_COMPONENTS