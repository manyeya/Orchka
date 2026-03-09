"use client";

import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from "react";
import type { CredentialType } from "@orchka/credentials-core/types";
import type { Node } from "@xyflow/react";

import type { WorkflowNodeStatus } from "./workflow-node";

export interface NodeExecutionData {
  input: unknown;
  output: unknown;
  timestamp: number;
  iteration?: {
    index: number;
    total: number;
  };
}

export interface LoopIterationProgress {
  index: number;
  total: number;
}

export interface CredentialOption {
  id: string;
  name: string;
}

export interface CredentialOptionsResult {
  items: CredentialOption[];
  isLoading: boolean;
  error: Error | null;
}

export interface NodeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export interface NodeEditorBridgeValue {
  nodes: Node[];
  activeNodeModalId: string | null;
  setActiveNodeModalId: (id: string | null) => void;
  updateNode: (args: { id: string; updates: Partial<Node> }) => void;
  deleteNode: (id: string) => void;
  nodeStatuses: Record<string, WorkflowNodeStatus>;
  nodeExecutionData: Record<string, NodeExecutionData>;
  nodeIterations: Record<string, LoopIterationProgress>;
  useCredentialsByType: (type: CredentialType) => CredentialOptionsResult;
  NodeSelector?: ComponentType<NodeSelectorProps>;
}

const NodeEditorBridgeContext = createContext<NodeEditorBridgeValue | null>(null);

export function NodeEditorBridgeProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: NodeEditorBridgeValue;
}) {
  return (
    <NodeEditorBridgeContext.Provider value={value}>
      {children}
    </NodeEditorBridgeContext.Provider>
  );
}

export function useNodeEditorBridge(): NodeEditorBridgeValue {
  const bridge = useContext(NodeEditorBridgeContext);

  if (!bridge) {
    throw new Error("NodeEditorBridgeProvider is missing");
  }

  return bridge;
}

export function useNodeConfigActions(nodeId: string) {
  const bridge = useNodeEditorBridge();

  return {
    status: bridge.nodeStatuses[nodeId] ?? "initial",
    iteration: bridge.nodeIterations[nodeId],
    openModal: () => bridge.setActiveNodeModalId(nodeId),
    closeModal: () => bridge.setActiveNodeModalId(null),
    updateNode: (updates: Partial<Node>) => bridge.updateNode({ id: nodeId, updates }),
    updateNodeData: (data: unknown) =>
      bridge.updateNode({ id: nodeId, updates: { data } as Partial<Node> }),
  };
}

export function useNodeSelectorComponent() {
  const bridge = useNodeEditorBridge();

  if (!bridge.NodeSelector) {
    throw new Error("Node selector component is not configured in NodeEditorBridgeProvider");
  }

  return bridge.NodeSelector;
}
