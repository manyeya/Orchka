"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { BaseAiNodeComponent } from "../base-ai-node";
import { Bot } from "lucide-react";
import { memo, useCallback } from "react";
import { NodeDetailModal, useNodeConfigActions } from "@orchka/nodes/editor";
import { AIAgentSettingsForm, type AIAgentSettingsFormValues } from "./ai-agent-settings-form";

type AIAgentNodeType = Node<AIAgentSettingsFormValues>;

export const AIAgentNode = memo((props: NodeProps<AIAgentNodeType>) => {
  const nodeData = props.data as AIAgentSettingsFormValues;
  const toolCount = (nodeData.enabledTools?.length || 0) + (nodeData.customTools?.length || 0);
  const description = toolCount > 0
    ? `${nodeData.model} • ${toolCount} tool${toolCount !== 1 ? "s" : ""}`
    : nodeData.model || "Not Configured";
  const { status, openModal, closeModal, updateNode } = useNodeConfigActions(props.id);

  const handleFormSubmit = useCallback(
    (values: AIAgentSettingsFormValues) => {
      updateNode({ data: values });
      closeModal();
    },
    [closeModal, updateNode]
  );

  const handleCancel = useCallback(() => {
    closeModal();
  }, [closeModal]);

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
      <BaseAiNodeComponent
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
