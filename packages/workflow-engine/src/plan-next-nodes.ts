/**
 * Pure scheduling logic for the node-per-job engine, extracted so it can be
 * unit-tested without Redis or BullMQ. Given the DAG and the current
 * completed/skipped sets, decide which nodes are ready to run and whether the
 * workflow is finished.
 *
 * The same logic underpins both the sequential path (take readyNodes[0]) and
 * the parallel path (enqueue all readyNodes). Keeping it pure means the
 * diamond / fan-in ordering can be verified deterministically in tests.
 */

export interface DagEdge {
  fromNodeId: string;
  toNodeId: string;
}

export interface PlanInput {
  /** node id whose job just finished (used to prioritise depth-first) */
  currentNodeId: string;
  /** every node id in the workflow, in topological order */
  sortedNodeIds: string[];
  /** node id -> parent node ids that must complete before it runs */
  dependencies: Map<string, string[]>;
  /** DAG edges (parent -> child) */
  edges: DagEdge[];
  /** node ids that have finished executing */
  completed: Set<string>;
  /** node ids skipped (non-taken branches) */
  skipped: Set<string>;
}

/**
 * A node is ready when it is neither completed nor skipped and every one of
 * its dependencies is in the completed set. (A skipped dependency does not
 * satisfy a fan-in: see `effectiveDepsSatisfied`.)
 */
function isReady(
  nodeId: string,
  deps: Map<string, string[]>,
  completed: Set<string>,
  skipped: Set<string>
): boolean {
  if (completed.has(nodeId) || skipped.has(nodeId)) return false;
  const parents = deps.get(nodeId) || [];
  return parents.every((p) => completed.has(p) || skipped.has(p))
    // require at least one real (completed, not skipped) parent when the node
    // has parents — a node all of whose parents were skipped is itself skipped
    // upstream, so it should not become ready here.
    && (parents.length === 0 || parents.some((p) => completed.has(p)));
}

/**
 * Compute the set of nodes ready to execute. Direct children of the
 * just-finished node come first (depth-first within a branch); if none are
 * ready we scan the whole graph in topological order. The returned list is
 * de-duplicated and stable.
 */
export function computeReadyNodes(input: PlanInput): string[] {
  const { currentNodeId, sortedNodeIds, dependencies, edges, completed, skipped } = input;

  const children = new Map<string, string[]>();
  for (const e of edges) {
    const arr = children.get(e.fromNodeId) || [];
    arr.push(e.toNodeId);
    children.set(e.fromNodeId, arr);
  }

  const ready: string[] = [];
  const seen = new Set<string>();

  // Depth-first: direct children of the current node first.
  for (const childId of children.get(currentNodeId) || []) {
    if (seen.has(childId)) continue;
    if (isReady(childId, dependencies, completed, skipped)) {
      ready.push(childId);
      seen.add(childId);
    }
  }

  // Then any other ready node, in topological order (fan-in joins, other branches).
  for (const candidateId of sortedNodeIds) {
    if (seen.has(candidateId)) continue;
    if (isReady(candidateId, dependencies, completed, skipped)) {
      ready.push(candidateId);
      seen.add(candidateId);
    }
  }

  return ready;
}

/**
 * The workflow is complete when every node is either completed or skipped.
 * Used (with a finalize guard) so the last branch to finish ends the run,
 * rather than the first branch that happens to find no ready successors.
 */
export function isWorkflowComplete(
  sortedNodeIds: string[],
  completed: Set<string>,
  skipped: Set<string>
): boolean {
  return sortedNodeIds.every((id) => completed.has(id) || skipped.has(id));
}
