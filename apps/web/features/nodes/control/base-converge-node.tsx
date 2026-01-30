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

/** Input handle configuration for convergent nodes */
export interface InputHandle {
  /** Unique identifier for the handle (e.g., "input-1", "input-2", "branch-a") */
  id: string;
  /** Display label for the handle */
  label: string;
  /** Vertical position offset as percentage (0-100), defaults to evenly distributed */
  position?: number;
}

interface BaseConvergeNodeProps extends NodeProps {
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
  /** Input handles configuration - supports multiple inputs for merging */
  inputs: InputHandle[];
}

/**
 * Base component for convergent control flow nodes (Merge).
 * Supports multiple input handles with configurable positions for merging multiple branches.
 * The inverse of BaseControlNode - multiple inputs on the left, single output on the right.
 */
export const BaseConvergeNode = memo((props: BaseConvergeNodeProps) => {
  const {
    icon: Icon,
    name,
    description,
    children,
    status,
    onSettingsClick,
    onDoubleClick,
    inputs,
  } = props;

  const deleteNode = useDeleteNode();
  const setActiveNodeId = useSetAtom(activeSettingsNodeIdAtom);

  const handleRemoveClick = useCallback(() => {
    deleteNode(props.id);
    setActiveNodeId(null);
  }, [props.id, deleteNode, setActiveNodeId]);

  // Calculate positions for input handles
  const isVertical = props.targetPosition === Position.Top || props.targetPosition === Position.Bottom;
  const getHandleStyle = (index: number, total: number, customPosition?: number) => {
    if (customPosition !== undefined) {
      return isVertical ? { left: `${customPosition}%` } : { top: `${customPosition}%` };
    }
    // Evenly distribute handles
    const spacing = 100 / (total + 1);
    const position = spacing * (index + 1);
    return isVertical ? { left: `${position}%` } : { top: `${position}%` };
  };

  // Calculate minimum dimension based on number of inputs
  const needsExtraSpace = inputs.length > 2;
  const minSpace = needsExtraSpace ? inputs.length * 20 + 16 : undefined;

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
          className={needsExtraSpace ? "items-center justify-center" : undefined}
          style={isVertical
            ? (minSpace ? { minWidth: `${minSpace}px` } : undefined)
            : (minSpace ? { minHeight: `${minSpace}px` } : undefined)
          }
        >
          {typeof Icon === "string" ? (
            <Image src={Icon} alt={name} width={16} height={16} />
          ) : (
            <Icon className="size-4 text-muted-foreground group-hover:text-primary size-6" />
          )}
          {children}

          {/* Multiple input handles with labels */}
          {/* IMPORTANT: Handle IDs must be stable and unique for this node */}
          {inputs.map((input, index) => (
            <BaseHandle
              key={`${props.id}-input-${index}`}
              id={`${props.id}-input-${index}`}
              type="target"
              position={props.targetPosition || Position.Left}
              style={getHandleStyle(index, inputs.length, input.position)}
            >
              <span className={`absolute whitespace-nowrap text-[6px] text-muted-foreground ${isVertical
                  ? "bottom-2 left-1/2 -translate-x-1/2"
                  : "right-4 top-1/2 -translate-y-1/2"
                }`}>
                {input.label}
              </span>
            </BaseHandle>
          ))}

          {/* Single output handle */}
          <BaseHandle
            id={`${props.id}-source`}
            type="source"
            position={props.sourcePosition || Position.Right}
          />
        </BaseNodeContent>
      </BaseNode>
    </WorkflowNode>
  );
});

BaseConvergeNode.displayName = "BaseConvergeNode";
