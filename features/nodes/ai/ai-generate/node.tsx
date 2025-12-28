"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { BaseAiNodeComponent } from "../base-ai-node";
import { Sparkles } from "lucide-react";
import { memo, useCallback } from "react";
import { NodeDetailModal } from "@/features/editor/components/node-detail-modal";
import { AIGenerateSettingsForm } from "./ai-generate-settings-form";
import type { AIGenerateSettings } from "./types";
import { useSetAtom } from "jotai";
import { updateNodeAtom, activeNodeModalIdAtom } from "@/features/editor/store";
import { useNodeStatus } from "@/features/nodes/utils/use-node-status";
import { getWorkflowNodeToken, workflowNodeChannel } from "@/features/nodes/utils/realtime";

type AIGenerateNodeType = Node<AIGenerateSettings>;

export const AIGenerateNode = memo((props: NodeProps<AIGenerateNodeType>) => {
  const nodeData = props.data as AIGenerateSettings;
  const description = nodeData.model || "Not Configured";

  const status = useNodeStatus({
    nodeId: props.id,
    channel: workflowNodeChannel().name,
    topic: "status",
    refreshToken: getWorkflowNodeToken,
  });

  const setActiveNodeId = useSetAtom(activeNodeModalIdAtom);
  const updateNode = useSetAtom(updateNodeAtom);

  const handleFormSubmit = useCallback(
    (values: AIGenerateSettings) => {
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
