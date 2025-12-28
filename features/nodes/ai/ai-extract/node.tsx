"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { BaseAiNodeComponent } from "../base-ai-node";
import { FileJson } from "lucide-react";
import { memo, useCallback } from "react";
import { NodeDetailModal } from "@/features/editor/components/node-detail-modal";
import { AIExtractSettingsForm } from "./ai-extract-settings-form";
import type { AIExtractSettings } from "./types";
import { useSetAtom } from "jotai";
import { updateNodeAtom, activeNodeModalIdAtom } from "@/features/editor/store";
import { useNodeStatus } from "@/features/nodes/utils/use-node-status";
import { getWorkflowNodeToken, workflowNodeChannel } from "@/features/nodes/utils/realtime";

type AIExtractNodeType = Node<AIExtractSettings>;

export const AIExtractNode = memo((props: NodeProps<AIExtractNodeType>) => {
  const nodeData = props.data as AIExtractSettings;
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
    (values: AIExtractSettings) => {
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
