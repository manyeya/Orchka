"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { BaseAiNodeComponent } from "../base-ai-node";
import { Sparkles } from "lucide-react";
import { memo, useCallback } from "react";
import { NodeDetailModal, useNodeConfigActions } from "@orchka/nodes/editor";
import { AIGenerateSettingsForm } from "./ai-generate-settings-form";
import type { AIGenerateSettings } from "./types";

type AIGenerateNodeType = Node<AIGenerateSettings>;

export const AIGenerateNode = memo((props: NodeProps<AIGenerateNodeType>) => {
  const nodeData = props.data as AIGenerateSettings;
  const description = nodeData.model || "Not Configured";
  const { status, openModal, closeModal, updateNode } = useNodeConfigActions(props.id);

  const handleFormSubmit = useCallback(
    (values: AIGenerateSettings) => {
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
        nodeName={nodeData.name || "AI Generate"}
        nodeIcon={<Sparkles className="size-5" />}
      >
        <AIGenerateSettingsForm
          defaultValues={nodeData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </NodeDetailModal>
      <BaseAiNodeComponent
        {...props}
        id={props.id}
        icon={Sparkles}
        name={nodeData.name || "AI Generate"}
        description={description}
        status={status}
        onSettingsClick={openModal}
        onDoubleClick={openModal}
      />
    </>
  );
});

AIGenerateNode.displayName = "AIGenerateNode";
