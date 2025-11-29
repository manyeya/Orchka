import initialNode from "@/components/nodes/initial-node";
import type { NodeTypes } from "@xyflow/react";

export enum NodeType {
    INITIAL = 'INITIAL'
}
export const nodeComponents = {
    [NodeType.INITIAL]: initialNode,
} as const satisfies NodeTypes

export type RegisteredNodeType = keyof typeof nodeComponents