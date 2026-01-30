"use client";

import type { Edge, Node, NodeProps } from "@xyflow/react";
import { GitMerge } from "lucide-react";
import { memo, useCallback, useEffect, useMemo } from "react";
import { useSetAtom } from "jotai";
import { useStore, ReactFlowState } from "@xyflow/react";

import { NodeDetailModal } from "@/features/editor/components/node-detail-modal";
import { updateNodeAtom, activeNodeModalIdAtom } from "@/features/editor/store";
import { useNodeStatus } from "@/features/nodes/utils/use-node-status";
import { BaseConvergeNode } from "../base-converge-node";
import type { MergeNodeData, MergeSource } from "../types";
import { MergeSettingsForm, type MergeSettingsFormValues } from "./merge-settings-form";

type MergeNodeType = Node<MergeNodeData>;

// Selector to get edges that target our node
const selectIncomingEdges = (nodeId: string) => (state: ReactFlowState) =>
  state.edges.filter((edge: Edge) => edge.target === nodeId);

// Selector to get all nodes
const selectNodes = (state: ReactFlowState) => state.nodes;

/**
 * Get connected node info from edges and nodes
 */
function getConnectedSources(
  nodeId: string,
  edges: Edge[],
  nodes: Node[]
): MergeSource[] {
  const incomingEdges = edges.filter((edge: Edge) => edge.target === nodeId);
  const sourceNodeIds = incomingEdges.map((edge: Edge) => edge.source);

  return sourceNodeIds
    .map((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return null;
      const nodeName = (node.data as { name?: string })?.name || "";
      return {
        id: nodeId,
        label: nodeName,
      } as MergeSource;
    })
    .filter(Boolean) as MergeSource[];
}

/**
 * Merge Node Component
 *
 * A control flow node that converges multiple workflow branches into a single output.
 * Automatically detects connected node names and fills them in the sources.
 */
export const MergeNode = memo((props: NodeProps<MergeNodeType>) => {
  const nodeData = props.data as MergeNodeData;

  // Use store selectors to reactively get edges and nodes
  const incomingEdges = useStore(selectIncomingEdges(props.id));
  const allNodes = useStore(selectNodes);

  const getModeDescription = (mode?: string) => {
    switch (mode) {
      case "append":
        return "Append arrays";
      case "mergeByKey":
        return "Join by key";
      case "keepFirst":
        return "First value";
      case "keepLast":
        return "Last value";
      case "combine":
        return "Merge objects";
      default:
        return "No mode set";
    }
  };

  const description = getModeDescription(nodeData.mode);

  const status = useNodeStatus({
    nodeId: props.id,
  });

  const setActiveNodeId = useSetAtom(activeNodeModalIdAtom);
  const updateNode = useSetAtom(updateNodeAtom);

  // Get connected sources - nodes that have edges to this merge node
  const connectedSources = useMemo(() => {
    return getConnectedSources(props.id, incomingEdges, allNodes);
  }, [props.id, incomingEdges, allNodes]);

  // Smart auto-update: fill in connected node names without removing manual sources
  useEffect(() => {
    if (connectedSources.length === 0) return;

    const currentSources = nodeData.sources || [];
    // Create a new array by merging current sources with connected ones
    // For each position, if we have a connected source and the current source is generic/empty, update it
    const updatedSources = currentSources.map((source, index) => {
      const connectedForPosition = connectedSources[index];
      // If we have a connected node for this position and the current label is generic, use the connected name
      if (connectedForPosition && (source.label.startsWith("Source ") || source.label.startsWith("Input "))) {
        return {
          ...source,
          label: connectedForPosition.label,
        };
      }
      return source;
    });

    // Check if we actually need to update
    const hasChanges = updatedSources.some((source, index) =>
      source.label !== currentSources[index]?.label
    );

    if (hasChanges) {
      updateNode({
        id: props.id,
        updates: {
          data: {
            ...nodeData,
            sources: updatedSources,
          } as MergeNodeData,
        },
      });
    }
  }, [connectedSources, props.id, nodeData, updateNode]);

  const handleFormSubmit = useCallback(
    (values: MergeSettingsFormValues) => {
      console.log("MergeNode handleFormSubmit:", values);
      updateNode({
        id: props.id,
        updates: {
          data: values,
        },
      });
      setActiveNodeId(null);
    },
    [props.id, updateNode, setActiveNodeId]
  );

  const handleCancel = useCallback(() => {
    setActiveNodeId(null);
  }, [setActiveNodeId]);

  const openModal = useCallback(() => {
    setActiveNodeId(props.id);
  }, [props.id, setActiveNodeId]);

  // Build input handles based on CONFIGURED sources (nodeData.sources)
  // This ensures handles appear even when not yet connected by wires
  const configuredSources = nodeData.sources || [];
  const numHandles = Math.max(2, configuredSources.length);

  const inputs = Array.from({ length: numHandles }, (_, index) => {
    const configuredSource = configuredSources[index];
    const label = configuredSource?.label || `Input ${index + 1}`;
    return {
      id: `input-${index}`,
      label: label,
      position: numHandles > 2
        ? ((index + 1) / (numHandles + 1)) * 100
        : undefined,
    };
  });

  return (
    <>
      <NodeDetailModal
        nodeId={props.id}
        nodeName={nodeData.name || "Merge"}
        nodeIcon={<GitMerge className="size-5" />}
      >
        <MergeSettingsForm
          defaultValues={nodeData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </NodeDetailModal>
      <BaseConvergeNode
        {...props}
        id={props.id}
        icon={GitMerge}
        name={nodeData.name || "Merge"}
        description={description}
        status={status}
        onSettingsClick={openModal}
        onDoubleClick={openModal}
        inputs={inputs}
      />
    </>
  );
});

MergeNode.displayName = "MergeNode";
