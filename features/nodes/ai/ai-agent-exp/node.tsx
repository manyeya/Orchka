"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { BaseAiNodeComponent } from "../base-ai-node";
import { BotMessageSquare } from "lucide-react";
import { memo, useCallback } from "react";
import { NodeDetailModal } from "@/features/editor/components/node-detail-modal";
import { AIAgentExpSettingsForm } from "./ai-agent-exp-settings-form";
import type { AIAgentExpSettings } from "./types";
import { useSetAtom } from "jotai";
import { updateNodeAtom, activeNodeModalIdAtom } from "@/features/editor/store";
import { useNodeStatus } from "@/features/nodes/utils/use-node-status";
import { getWorkflowNodeToken, workflowNodeChannel } from "@/features/nodes/utils/realtime";

type AIAgentExpNodeType = Node<AIAgentExpSettings>;

export const AIAgentExpNode = memo((props: NodeProps<AIAgentExpNodeType>) => {
  const nodeData = props.data as AIAgentExpSettings;
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
    (values: AIAgentExpSettings) => {
      updateNode({ id: props.id, updates: { data: values } });
      setActiveNodeId(null);
    },
    [props.id, updateNode, setActiveNodeId]
  );

  const handleCancel = useCallback(() => setActiveNodeId(null), [setActiveNodeId]);
  const openModal = useCallback(() => setActiveNodeId(props.id), [props.id, setActiveNodeId]);

  return (
    <>
      <NodeDetailModal
        nodeId={props.id}
        nodeName={nodeData.name || "AI Agent"}
        nodeIcon={<BotMessageSquare className="size-5" />}
      >
        <AIAgentExpSettingsForm
          defaultValues={nodeData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </NodeDetailModal>
      <BaseAiNodeComponent
        {...props}
        id={props.id}
        icon={BotMessageSquare}
        name={nodeData.name || "AI Agent"}
        description={description}
        status={status}
        onSettingsClick={openModal}
        onDoubleClick={openModal}
      />
    </>
  );
});

AIAgentExpNode.displayName = "AIAgentExpNode";
