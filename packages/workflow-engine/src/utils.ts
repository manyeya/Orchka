export interface GenericEdge {
  // React Flow format
  source?: string;
  target?: string;
  // Prisma format
  fromNodeId?: string;
  toNodeId?: string;
  [key: string]: unknown;
}

/**
 * Generic node interface - works with React Flow Node or Prisma Node
 */
export interface GenericNode {
  id: string;
  [key: string]: unknown;
}

/**
 * Normalizes an edge to get source and target, regardless of format
 */
export function normalizeEdge(edge: GenericEdge): { source: string; target: string } {
  const source = edge.source ?? edge.fromNodeId;
  const target = edge.target ?? edge.toNodeId;

  if (!source || !target) {
    throw new Error(
      `Invalid edge format. Expected either (source, target) or (fromNodeId, toNodeId). ` +
      `Got: ${JSON.stringify(edge)}`
    );
  }

  return { source, target };
}

/**
 * Generic cycle detection that works with any node/edge types
 */
export function detectCyclesGeneric<N extends GenericNode, E extends GenericEdge>(
  nodes: N[],
  edges: E[]
): string[][] {
  // Build adjacency list
  const adjacencyList = new Map<string, string[]>();
  for (const node of nodes) {
    adjacencyList.set(node.id, []);
  }
  for (const edge of edges) {
    const { source, target } = normalizeEdge(edge);
    const neighbors = adjacencyList.get(source) || [];
    neighbors.push(target);
    adjacencyList.set(source, neighbors);
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(nodeId: string, path: string[]): void {
    if (recursionStack.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      const cycle = path.slice(cycleStart).concat([nodeId]);
      cycles.push(cycle);
      return;
    }

    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      dfs(neighbor, [...path]);
    }

    recursionStack.delete(nodeId);
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return cycles;
}

/**
 * Performs topological sort and returns sorted nodes array.
 * Throws an error if a cycle is detected.
 * 
 * Works with both React Flow types and Prisma types:
 * - React Flow: Node[] with Edge[] (source/target)
 * - Prisma: Node[] with Connection[] (fromNodeId/toNodeId)
 * 
 * This implementation is branch-aware and correctly handles:
 * - Control nodes with multiple output branches
 * - Convergence points where multiple branches merge
 * - Proper execution order respecting branch dependencies
 * 
 * Requirements:
 * - 5.4: Maintain correct execution order respecting branch dependencies
 * 
 * @param nodes - Array of workflow nodes (React Flow or Prisma)
 * @param edges - Array of workflow edges/connections (React Flow or Prisma)
 * @returns Array of nodes in topological order
 * @throws Error if the graph contains a cycle
 */
export function topologicalSortNodes<N extends GenericNode, E extends GenericEdge>(
  nodes: N[],
  edges: E[]
): N[] {
  // Build adjacency list using normalized edges
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize for all nodes
  for (const node of nodes) {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  // Build adjacency list and calculate in-degrees
  // For branch-aware sorting, we treat all edges equally in terms of dependencies
  // The branch filtering happens at runtime in the executor
  for (const edge of edges) {
    const { source, target } = normalizeEdge(edge);
    const neighbors = adjacencyList.get(source) || [];
    neighbors.push(target);
    adjacencyList.set(source, neighbors);
    inDegree.set(target, (inDegree.get(target) || 0) + 1);
  }

  // Find nodes with no incoming edges (Kahn's algorithm)
  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  const sorted: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    const neighbors = adjacencyList.get(current) || [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);

      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Check for cycles
  if (sorted.length !== nodes.length) {
    // Detect and report cycles
    const cycles = detectCyclesGeneric(nodes, edges);
    const cycleDescription = cycles
      .map(cycle => cycle.join(' → '))
      .join('; ');
    throw new Error(`Workflow contains cycles: ${cycleDescription}`);
  }

  // Map sorted node IDs back to Node objects, preserving order
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  return sorted
    .map(nodeId => nodeMap.get(nodeId))
    .filter((node): node is N => node !== undefined);
}