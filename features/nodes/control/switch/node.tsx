"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { GitMerge } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { useSetAtom } from "jotai";

import { NodeDetailModal } from "@/features/editor/components/node-detail-modal";
import { updateNodeAtom, activeNodeModalIdAtom } from "@/features/editor/store";
import { useNodeStatus } from "@/features/nodes/utils/use-node-status";
import { getWorkflowNodeToken, workflowNodeChannel } from "@/features/nodes/utils/realtime";
import { BaseControlNode, type OutputHandle } from "../base-control-node";
import type { SwitchNodeData } from "../types";
import { SwitchSettingsForm, type SwitchSettingsFormValues } from "./switch-settings-form";

type SwitchNodeType = Node<SwitchNodeData>;

/**
 * Switch Node Component
 * 
 * A control flow node that evaluates an expression and routes execution
 * to one of multiple branches based on matching case values.
 * Includes a default branch for when no cases match.
 */
export const SwitchNode = memo((props: NodeProps<SwitchNodeType>) => {
  const nodeData = props.data as SwitchNodeData;
  const description = nodeData.expression
    ? `${nodeData.expression.substring(0, 30)}${nodeData.expression.length > 30 ? "..." : ""}`
    : "No expression set";

  const status = useNodeStatus({
    nodeId: props.id,
    channel: workflowNodeChannel().name,
    topic: "status",
    refreshToken: getWorkflowNodeToken,
  });

  const setActiveNodeId = useSetAtom(activeNodeModalIdAtom);
  const updateNode = useSetAtom(updateNodeAtom);

  // Build output handles from cases + default
  const outputs: OutputHandle[] = useMemo(() => {
    const caseOutputs: OutputHandle[] = (nodeData.cases || []).map((c) => ({
      id: c.id,
      label: c.label,
    }));
    // Always add default handle at the end
    return [...caseOutputs, { id: "default", label: "default" }];
  }, [nodeData.cases]);

  const handleFormSubmit = useCallback(
    (values: SwitchSettingsFormValues) => {
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

  return (
    <>
      <NodeDetailModal
        nodeId={props.id}
        nodeName={nodeData.name || "Switch"}
        nodeIcon={<GitMerge className="size-5" />}
      >
        <SwitchSettingsForm
          defaultValues={nodeData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </NodeDetailModal>
      <BaseControlNode
        {...props}
        id={props.id}
        icon={GitMerge}
        name={nodeData.name || "Switch"}
        description={description}
        status={status}
        onSettingsClick={openModal}
        onDoubleClick={openModal}
        outputs={outputs}
      />
    </>
  );
});

SwitchNode.displayName = "SwitchNode";
