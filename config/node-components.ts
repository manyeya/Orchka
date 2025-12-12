import InitialNode from "@/features/nodes/utils/initial-node";
import { ManualTriggerNode } from "@/features/nodes/trigger/manual/manual-trigger-node";
import { HttpRequestNode } from "@/features/nodes/action/https-request/node";
import type { NodeTypes } from "@xyflow/react";

export enum NodeType {
    INITIAL = 'INITIAL',
    MANUAL_TRIGGER = 'MANUAL_TRIGGER',
    HTTP_REQUEST = 'HTTP_REQUEST'
}

export const nodeComponents = {
    [NodeType.INITIAL]: InitialNode,
    [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
    [NodeType.HTTP_REQUEST]: HttpRequestNode,
} as const satisfies NodeTypes

export type RegisteredNodeType = keyof typeof nodeComponents