"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { BaseAiNodeComponent } from "../base-ai-node";
import { FileJson } from "lucide-react";
import { memo, useCallback } from "react";
import { NodeDetailModal, useNodeConfigActions } from "@orchka/nodes/editor";
import { AIExtractSettingsForm } from "./ai-extract-settings-form";
import type { AIExtractSettings } from "./types";

type AIExtractNodeType = Node<AIExtractSettings>;

export const AIExtractNode = memo((props: NodeProps<AIExtractNodeType>) => {
  const nodeData = props.data as AIExtractSettings;
  const description = nodeData.model || "Not Configured";
  const { status, openModal, closeModal, updateNode } = useNodeConfigActions(props.id);

  const handleFormSubmit = useCallback(
    (values: AIExtractSettings) => {
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
        nodeName={nodeData.name || "AI Extract"}
        nodeIcon={<FileJson className="size-5" />}
      >
        <AIExtractSettingsForm
          defaultValues={nodeData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </NodeDetailModal>
      <BaseAiNodeComponent
        {...props}
        id={props.id}
        icon={FileJson}
        name={nodeData.name || "AI Extract"}
        description={description}
        status={status}
        onSettingsClick={openModal}
        onDoubleClick={openModal}
      />
    </>
  );
});

AIExtractNode.displayName = "AIExtractNode";
