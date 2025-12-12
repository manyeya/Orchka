import InitialNode from "@/features/nodes/utils/initial-node";
import { ManualTriggerNode } from "@/features/nodes/trigger/manual/manual-trigger-node";
import { HttpRequestNode } from "@/features/nodes/action/https-request/node";
import type { NodeTypes } from "@xyflow/react";

export enum NodeType {
    INITIAL = 'INITIAL',
    MANUAL_TRIGGER = 'MANUAL_TRIGGER',
    HTTP_REQUEST = 'HTTP_REQUEST'
}

export const NODE_COMPONENTS = {
    [NodeType.INITIAL]: InitialNode,
    [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
    [NodeType.HTTP_REQUEST]: HttpRequestNode,
} as const satisfies NodeTypes

/**
 * Registry of required fields per node type.
 * Add new node types here with their required field names.
 * All nodes require a 'name' field by default.
 */
export const NODE_REQUIRED_FIELDS: Record<string, string[]> = {
    [NodeType.HTTP_REQUEST]: ['name', 'url'],
    [NodeType.MANUAL_TRIGGER]: ['name'],
    [NodeType.INITIAL]: [],
};


export const DEFAULT_REQUIRED_FIELDS = ['name'];

export type RegisteredNodeType = keyof typeof NODE_COMPONENTS