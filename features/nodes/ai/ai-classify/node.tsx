"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { BaseAiNodeComponent } from "../base-ai-node";
import { Tags } from "lucide-react";
import { memo, useCallback } from "react";
import { NodeDetailModal } from "@/features/editor/components/node-detail-modal";
import { AIClassifySettingsForm } from "./ai-classify-settings-form";
import type { AIClassifySettings } from "./types";
import { useSetAtom } from "jotai";
import { updateNodeAtom, activeNodeModalIdAtom } from "@/features/editor/store";
import { useNodeStatus } from "@/features/nodes/utils/use-node-status";
import { getWorkflowNodeToken, workflowNodeChannel } from "@/features/nodes/utils/realtime";

type AIClassifyNodeType = Node<AIClassifySettings>;

export const AIClassifyNode = memo((props: NodeProps<AIClassifyNodeType>) => {
  const nodeData = props.data as AIClassifySettings;
  const categoryCount = nodeData.categories?.length || 0;
  const description = `${nodeData.model} • ${categoryCount} categories`;

  const status = useNodeStatus({
    nodeId: props.id,
    channel: workflowNodeChannel().name,
    topic: "status",
    refreshToken: getWorkflowNodeToken,
  });

  const setActiveNodeId = useSetAtom(activeNodeModalIdAtom);
  const updateNode = useSetAtom(updateNodeAtom);

  const handleFormSubmit = useCallback(
    (values: AIClassifySettings) => {
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
