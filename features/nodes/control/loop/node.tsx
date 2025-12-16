"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { Repeat } from "lucide-react";
import { memo, useCallback } from "react";
import { useSetAtom } from "jotai";

import { NodeDetailModal } from "@/features/editor/components/node-detail-modal";
import { updateNodeAtom, activeNodeModalIdAtom } from "@/features/editor/store";
import { useNodeStatus } from "@/features/nodes/utils/use-node-status";
import { getWorkflowNodeToken, workflowNodeChannel } from "@/features/nodes/utils/realtime";
import { BaseControlNode } from "../base-control-node";
import type { LoopNodeData } from "../types";
import { LoopSettingsForm, type LoopSettingsFormValues } from "./loop-settings-form";

type LoopNodeType = Node<LoopNodeData>;

/**
 * Loop Node Component
 * 
 * A control flow node that iterates over an array or a specified number of times.
 * Has two output handles: "loop" for each iteration and "done" after completion.
 * 
 * Requirements:
 * - 3.1: Display node with "loop" and "done" output handles
 * - 3.2: Support array mode (expression) and count mode (number input)
 */
export const LoopNode = memo((props: NodeProps<LoopNodeType>) => {
  const nodeData = props.data as LoopNodeData;
  
  // Build description based on mode
  let description: string;
  if (nodeData.mode === "array") {
    description = nodeData.arrayExpression
      ? `${nodeData.arrayExpression.substring(0, 25)}${nodeData.arrayExpression.length > 25 ? "..." : ""}`
      : "No array set";
  } else {
    description = nodeData.count !== undefined
      ? `${nodeData.count} iterations`
      : "No count set";
  }

  const status = useNodeStatus({
    nodeId: props.id,
    channel: workflowNodeChannel().name,
    topic: "status",
    refreshToken: getWorkflowNodeToken,
  });

  const setActiveNodeId = useSetAtom(activeNodeModalIdAtom);
  const updateNode = useSetAtom(updateNodeAtom);


  const handleFormSubmit = useCallback(
    (values: LoopSettingsFormValues) => {
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
        nodeName={nodeData.name || "Loop"}
        nodeIcon={<Repeat className="size-5" />}
      >
        <LoopSettingsForm
          defaultValues={nodeData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </NodeDetailModal>
      <BaseControlNode
        {...props}
        id={props.id}
        icon={Repeat}
        name={nodeData.name || "Loop"}
        description={description}
        status={status}
        onSettingsClick={openModal}
        onDoubleClick={openModal}
        outputs={[
          { id: "loop", label: "loop" },
          { id: "done", label: "done" },
        ]}
      />
    </>
  );
});

LoopNode.displayName = "LoopNode";
