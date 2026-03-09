import { NodeType, type NodeType as NodeTypeValue } from "../core/types";
import {
  executorsRegistry,
  getExecutor,
} from "../nodes/utils/execution/executors-registry";

export const CONTROL_NODE_TYPES = new Set<NodeTypeValue>([
  NodeType.IF_CONDITION,
  NodeType.SWITCH,
  NodeType.LOOP,
  NodeType.WAIT,
  NodeType.MERGE,
]);

export const VISUAL_NODE_TYPES = new Set<NodeTypeValue>([
  NodeType.GROUP,
  NodeType.ANNOTATION,
]);

export function isControlNode(nodeType: string): nodeType is NodeTypeValue {
  return CONTROL_NODE_TYPES.has(nodeType as NodeTypeValue);
}

export function isVisualNode(nodeType: string): nodeType is NodeTypeValue {
  return VISUAL_NODE_TYPES.has(nodeType as NodeTypeValue);
}

export { executorsRegistry, getExecutor };
