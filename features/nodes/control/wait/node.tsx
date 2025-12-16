"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { Clock } from "lucide-react";
import { memo, useCallback } from "react";
import { useSetAtom } from "jotai";

import { NodeDetailModal } from "@/features/editor/components/node-detail-modal";
import { updateNodeAtom, activeNodeModalIdAtom } from "@/features/editor/store";
import { useNodeStatus } from "@/features/nodes/utils/use-node-status";
import { getWorkflowNodeToken, workflowNodeChannel } from "@/features/nodes/utils/realtime";
import { BaseControlNode } from "../base-control-node";
import type { WaitNodeData } from "../types";
import { WaitSettingsForm, type WaitSettingsFormValues } from "./wait-settings-form";

type WaitNodeType = Node<WaitNodeData>;

/**
 * Wait Node Component
 * 
 * A control flow node that pauses workflow execution for a duration or until a specific time.
 * Has one input handle and one output handle.
 * 
 * Requirements:
 * - 4.1: Display node with one input handle and one output handle
 * - 4.2: Support duration mode and until mode
 */
export const WaitNode = memo((props: NodeProps<WaitNodeType>) => {
  const nodeData = props.data as WaitNodeData;
  
  // Build description based on mode
  let description: string;
  if (nodeData.mode === "duration") {
    if (nodeData.duration) {
      description = `${nodeData.duration.value} ${nodeData.duration.unit}`;
    } else {
      description = "No duration set";
    }
  } else {
    description = nodeData.until
      ? `Until ${nodeData.until.substring(0, 20)}${nodeData.until.length > 20 ? "..." : ""}`
      : "No time set";
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
    (values: WaitSettingsFormValues) => {
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
        nodeName={nodeData.name || "Wait"}
        nodeIcon={<Clock className="size-5" />}
      >
        <WaitSettingsForm
          defaultValues={nodeData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </NodeDetailModal>
      <BaseControlNode
        {...props}
        id={props.id}
        icon={Clock}
        name={nodeData.name || "Wait"}
        description={description}
        status={status}
        onSettingsClick={openModal}
        onDoubleClick={openModal}
        outputs={[
          { id: "main", label: "" },
        ]}
      />
    </>
  );
});

WaitNode.displayName = "WaitNode";
