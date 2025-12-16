"use client";

import { type NodeProps, Position } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { memo, type ReactNode, useCallback } from "react";

import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node";
import { BaseHandle } from "@/components/react-flow/base-handle";
import {
  WorkflowNode,
  type WorkflowNodeStatus,
} from "@/components/workflow-node";
import { useDeleteNode } from "@/features/editor/hooks/use-delete-node";
import { activeSettingsNodeIdAtom } from "@/features/editor/store";
import { useSetAtom } from "jotai";

/** Output handle configuration for control nodes */
export interface OutputHandle {
  /** Unique identifier for the handle (e.g., "true", "false", "case-1", "default") */
  id: string;
  /** Display label for the handle */
  label: string;
  /** Vertical position offset as percentage (0-100), defaults to evenly distributed */
  position?: number;
}

interface BaseControlNodeProps extends NodeProps {
  /** Icon to display in the node - can be a Lucide icon or image path */
  icon: LucideIcon | string;
  /** Name of the node */
  name: string;
  /** Optional description shown below the name */
  description?: string;
  /** Optional children to render inside the node */
  children?: ReactNode;
  /** Current execution status of the node */
  status?: WorkflowNodeStatus;
  /** Callback when settings button is clicked */
  onSettingsClick?: () => void;
  /** Callback when node is double-clicked */
  onDoubleClick?: () => void;
  /** Output handles configuration - supports multiple outputs for branching */
  outputs: OutputHandle[];
}

/**
 * Base component for control flow nodes (If, Switch, Loop, Wait).
 * Supports multiple output handles with configurable positions for branching logic.
 */
export const BaseControlNode = memo((props: BaseControlNodeProps) => {
  const {
    icon: Icon,
    name,
    description,
    children,
    status,
    onSettingsClick,
    onDoubleClick,
    outputs,
  } = props;

  const deleteNode = useDeleteNode();
  const setActiveNodeId = useSetAtom(activeSettingsNodeIdAtom);

  const handleRemoveClick = useCallback(() => {
    deleteNode(props.id);
    setActiveNodeId(null);
  }, [props.id, deleteNode, setActiveNodeId]);

  // Calculate vertical positions for output handles
  const getHandleStyle = (index: number, total: number, customPosition?: number) => {
    if (customPosition !== undefined) {
      return { top: `${customPosition}%` };
    }
    // Evenly distribute handles vertically
    const spacing = 100 / (total + 1);
    const position = spacing * (index + 1);
    return { top: `${position}%` };
  };

  // Calculate minimum height based on number of outputs
  // Only increase height for nodes with more than 2 outputs (like Switch with many cases)
  // Nodes with 1-2 outputs (If, Loop, Wait) keep default size
  const needsExtraHeight = outputs.length > 2;
  const minHeight = needsExtraHeight ? outputs.length * 20 + 16 : undefined;

  return (
    <WorkflowNode
      name={name}
      description={description}
      onRemoveClick={handleRemoveClick}
      onSettingsClick={onSettingsClick}
      showToolbar={true}
      status={status}
    >
      <BaseNode onDoubleClick={onDoubleClick} className="relative group">
        <BaseNodeContent
          className={needsExtraHeight ? "items-center justify-center" : undefined}
          style={minHeight ? { minHeight: `${minHeight}px` } : undefined}
        >
          {typeof Icon === "string" ? (
            <Image src={Icon} alt={name} width={16} height={16} />
          ) : (
            <Icon className="size-4 text-muted-foreground group-hover:text-primary" />
          )}
          {children}

          {/* Single input handle on the left */}
          <BaseHandle
            id={`${props.id}-target`}
            type="target"
            position={Position.Left}
          />

          {/* Multiple output handles on the right with labels */}
          {outputs.map((output, index) => (
            <BaseHandle
              key={output.id}
              id={output.id}
              type="source"
              position={Position.Right}
              style={getHandleStyle(index, outputs.length, output.position)}
            >
              <span className="absolute left-4 whitespace-nowrap text-[6px] text-muted-foreground">
                {output.label}
              </span>
            </BaseHandle>
          ))}
        </BaseNodeContent>
      </BaseNode>
    </WorkflowNode>
  );
});

BaseControlNode.displayName = "BaseControlNode";
