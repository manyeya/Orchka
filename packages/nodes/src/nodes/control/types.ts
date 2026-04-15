import type { WorkflowContext } from "../utils/execution/types";

/** If Node configuration */
export interface IfNodeData {
  name: string;
  condition: string; // Expression that evaluates to boolean
  [key: string]: unknown;
}

/** Switch Node case definition */
export interface SwitchCase {
  id: string;
  value: string; // Value to match against
  label: string; // Display label for the case
}

/** Switch Node configuration */
export interface SwitchNodeData {
  name: string;
  expression: string; // Expression to evaluate
  cases: SwitchCase[];
  [key: string]: unknown;
}

/** Loop Node configuration */
export interface LoopNodeData {
  name: string;
  mode: "array" | "count";
  arrayExpression?: string; // Expression that resolves to array
  count?: number; // Number of iterations
  [key: string]: unknown;
}

/** Wait Node configuration */
export interface WaitNodeData {
  name: string;
  mode: "duration" | "until";
  duration?: {
    value: number;
    unit: "seconds" | "minutes" | "hours" | "days";
  };
  until?: string; // ISO timestamp or expression
  [key: string]: unknown;
}

/** Result from control node execution indicating which branch to take */
export interface BranchDecision {
  /** The output handle ID to follow (e.g., "true", "false", "case-1", "default", "loop", "done") */
  branch: string;
  /** Optional data to pass to the branch */
  data?: unknown;
  /** For loop nodes: iteration context */
  iteration?: {
    index: number;
    total: number;
    item: unknown;
  };
}

/** Merge Node source configuration */
export interface MergeSource {
  id: string;
  label: string;
}

/** Merge Node configuration */
export interface MergeNodeData {
  name: string;
  mode: "append" | "mergeByKey" | "keepFirst" | "keepLast" | "combine" | "custom";
  sources: MergeSource[];
  keyField?: string; // For mergeByKey mode - field to join on
  includeAllFields?: boolean;
  /** JSONata expression for custom mode (e.g., $append($input1, $input2, $input3)) */
  expression?: string;
  [key: string]: unknown;
}

/** Extended executor result for control nodes */
export interface ControlNodeResult {
  context: WorkflowContext;
  branchDecision?: BranchDecision;
}
