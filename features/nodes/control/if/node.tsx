"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { memo, useCallback } from "react";
import { useSetAtom } from "jotai";

import { NodeDetailModal } from "@/features/editor/components/node-detail-modal";
import { updateNodeAtom, activeNodeModalIdAtom } from "@/features/editor/store";
import { useNodeStatus } from "@/features/nodes/utils/use-node-status";
import { getWorkflowNodeToken, workflowNodeChannel } from "@/features/nodes/utils/realtime";
import { BaseControlNode } from "../base-control-node";
import type { IfNodeData } from "../types";
import { IfSettingsForm, type IfSettingsFormValues } from "./if-settings-form";

type IfNodeType = Node<IfNodeData>;

/**
 * If Node Component
 * 
 * A control flow node that evaluates a condition and routes execution
 * to either the "true" or "false" branch based on the result.
 */
export const IfNode = memo((props: NodeProps<IfNodeType>) => {
  const nodeData = props.data as IfNodeData;
  const description = nodeData.condition
    ? `${nodeData.condition.substring(0, 30)}${nodeData.condition.length > 30 ? "..." : ""}`
    : "No condition set";

  const status = useNodeStatus({
    nodeId: props.id,
    channel: workflowNodeChannel().name,
    topic: "status",
    refreshToken: getWorkflowNodeToken,
  });

  const setActiveNodeId = useSetAtom(activeNodeModalIdAtom);
  const updateNode = useSetAtom(updateNodeAtom);

  const handleFormSubmit = useCallback(
    (values: IfSettingsFormValues) => {
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
        nodeName={nodeData.name || "If"}
        nodeIcon={<GitBranch className="size-5" />}
      >
        <IfSettingsForm
          defaultValues={nodeData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </NodeDetailModal>
      <BaseControlNode
        {...props}
        id={props.id}
        icon={GitBranch}
        name={nodeData.name || "If"}
        description={description}
        status={status}
        onSettingsClick={openModal}
        onDoubleClick={openModal}
        outputs={[
          { id: "true", label: "true" },
          { id: "false", label: "false" },
        ]}
      />
    </>
  );
});

IfNode.displayName = "IfNode";
