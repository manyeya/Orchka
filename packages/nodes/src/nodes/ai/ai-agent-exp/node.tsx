"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { BaseAiNodeComponent } from "../base-ai-node";
import { BotMessageSquare } from "lucide-react";
import { memo, useCallback } from "react";
import { NodeDetailModal, useNodeConfigActions } from "@orchka/nodes/editor";
import { AIAgentExpSettingsForm } from "./ai-agent-exp-settings-form";
import type { AIAgentExpSettings } from "./types";

type AIAgentExpNodeType = Node<AIAgentExpSettings>;

export const AIAgentExpNode = memo((props: NodeProps<AIAgentExpNodeType>) => {
  const nodeData = props.data as AIAgentExpSettings;
  const toolCount = (nodeData.enabledTools?.length || 0) + (nodeData.customTools?.length || 0);
  const description = toolCount > 0
    ? `${nodeData.model} • ${toolCount} tool${toolCount !== 1 ? "s" : ""}`
    : nodeData.model || "Not Configured";
  const { status, openModal, closeModal, updateNode } = useNodeConfigActions(props.id);

  const handleFormSubmit = useCallback(
    (values: AIAgentExpSettings) => {
      updateNode({ data: values });
      closeModal();
    },
    [closeModal, updateNode]
  );

  const handleCancel = useCallback(() => closeModal(), [closeModal]);

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
