"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { BaseAiNodeComponent } from "../base-ai-node";
import { Tags } from "lucide-react";
import { memo, useCallback } from "react";
import { NodeDetailModal, useNodeConfigActions } from "@orchka/nodes/editor";
import { AIClassifySettingsForm } from "./ai-classify-settings-form";
import type { AIClassifySettings } from "./types";

type AIClassifyNodeType = Node<AIClassifySettings>;

export const AIClassifyNode = memo((props: NodeProps<AIClassifyNodeType>) => {
  const nodeData = props.data as AIClassifySettings;
  const categoryCount = nodeData.categories?.length || 0;
  const description = `${nodeData.model} • ${categoryCount} categories`;
  const { status, openModal, closeModal, updateNode } = useNodeConfigActions(props.id);

  const handleFormSubmit = useCallback(
    (values: AIClassifySettings) => {
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
        nodeName={nodeData.name || "AI Classify"}
        nodeIcon={<Tags className="size-5" />}
      >
        <AIClassifySettingsForm
          defaultValues={nodeData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </NodeDetailModal>
      <BaseAiNodeComponent
        {...props}
        id={props.id}
        icon={Tags}
        name={nodeData.name || "AI Classify"}
        description={description}
        status={status}
        onSettingsClick={openModal}
        onDoubleClick={openModal}
      />
    </>
  );
});

AIClassifyNode.displayName = "AIClassifyNode";
