"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { memo, useCallback } from "react";

import { NodeDetailModal, useNodeConfigActions } from "@orchka/nodes/editor";
import { BaseControlNode } from "../base-control-node";
import type { IfNodeData } from "../types";
import { IfSettingsForm, type IfSettingsFormValues } from "./if-settings-form";

type IfNodeType = Node<IfNodeData>;

/**
 * If Node Component
 * 
 * A control flow node that evaluates a condition and routes execution
 * to either the "true" or "false" branch based on the result.
 */
export const IfNode = memo((props: NodeProps<IfNodeType>) => {
  const nodeData = props.data as IfNodeData;
  const description = nodeData.condition
    ? `${nodeData.condition.substring(0, 30)}${nodeData.condition.length > 30 ? "..." : ""}`
    : "No condition set";

  const { status, openModal, closeModal, updateNode } = useNodeConfigActions(props.id);

  const handleFormSubmit = useCallback(
    (values: IfSettingsFormValues) => {
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
        nodeName={nodeData.name || "If"}
        nodeIcon={<GitBranch className="size-5" />}
      >
        <IfSettingsForm
          defaultValues={nodeData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </NodeDetailModal>
      <BaseControlNode
        {...props}
        id={props.id}
        icon={GitBranch}
        name={nodeData.name || "If"}
        description={description}
        status={status}
        onSettingsClick={openModal}
        onDoubleClick={openModal}
        outputs={[
          { id: "true", label: "true" },
          { id: "false", label: "false" },
        ]}
      />
    </>
  );
});

IfNode.displayName = "IfNode";
