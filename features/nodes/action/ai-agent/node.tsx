"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { BaseActionNode } from "../base-action-node";
import { Bot } from "lucide-react";
import { memo, useCallback } from "react";
import { NodeDetailModal } from "@/features/editor/components/node-detail-modal";
import { AIAgentSettingsForm, type AIAgentSettingsFormValues } from "./ai-agent-settings-form";
import { useSetAtom } from "jotai";
import { updateNodeAtom, activeNodeModalIdAtom } from "@/features/editor/store";
import { useNodeStatus } from "@/features/nodes/utils/use-node-status";
import {
  getWorkflowNodeToken,
  workflowNodeChannel,
} from "@/features/nodes/utils/realtime";

type AIAgentNodeType = Node<AIAgentSettingsFormValues>;

export const AIAgentNode = memo((props: NodeProps<AIAgentNodeType>) => {
  const nodeData = props.data as AIAgentSettingsFormValues;
  const toolCount = (nodeData.enabledTools?.length || 0) + (nodeData.customTools?.length || 0);
  const description = toolCount > 0
    ? `${nodeData.model} • ${toolCount} tool${toolCount !== 1 ? "s" : ""}`
    : nodeData.model || "Not Configured";

  const status = useNodeStatus({
    nodeId: props.id,
    channel: workflowNodeChannel().name,
    topic: "status",
    refreshToken: getWorkflowNodeToken,
  });

  const setActiveNodeId = useSetAtom(activeNodeModalIdAtom);
  const updateNode = useSetAtom(updateNodeAtom);

  const handleFormSubmit = useCallback(
    (values: AIAgentSettingsFormValues) => {
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
        nodeName={nodeData.name || "AI Agent"}
        nodeIcon={<Bot className="size-5" />}
      >
        <AIAgentSettingsForm
          defaultValues={nodeData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </NodeDetailModal>
      <BaseActionNode
        {...props}
        id={props.id}
        icon={Bot}
        name={nodeData.name || "AI Agent"}
        description={description}
        status={status}
        onSettingsClick={openModal}
        onDoubleClick={openModal}
      />
    </>
  );
});

AIAgentNode.displayName = "AIAgentNode";
