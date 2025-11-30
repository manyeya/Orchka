import { Node, Edge } from '@xyflow/react';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'cycle' | 'orphaned_node' | 'invalid_connection' | 'missing_trigger' | 'multiple_triggers';
  message: string;
  nodeIds?: string[];
  edgeId?: string;
}

export interface ValidationWarning {
  type: 'unreachable_node' | 'no_outputs' | 'missing_config';
  message: string;
  nodeIds?: string[];
}

/**
 * Detects cycles in a directed graph using DFS
 */
export function detectCycles(nodes: Node[], edges: Edge[]): string[][] {
  const adjacencyList = buildAdjacencyList(nodes, edges);
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(nodeId: string, path: string[]): void {
    if (recursionStack.has(nodeId)) {
      // Found a cycle - extract the cycle from the path
      const cycleStart = path.indexOf(nodeId);
      const cycle = path.slice(cycleStart).concat([nodeId]);
      cycles.push(cycle);
      return;
    }

    if (visited.has(nodeId)) {
      return;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      dfs(neighbor, [...path]);
    }

    recursionStack.delete(nodeId);
  }

  // Start DFS from all unvisited nodes
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return cycles;
}

/**
 * Checks if adding a new edge would create a cycle
 */
export function wouldCreateCycle(
  nodes: Node[],
  edges: Edge[],
  newEdge: { source: string; target: string }
): boolean {
  // Create a temporary edge list with the new edge
  const tempEdges = [...edges, {
    id: 'temp',
    source: newEdge.source,
    target: newEdge.target,
  } as Edge];

  const cycles = detectCycles(nodes, tempEdges);
  return cycles.length > 0;
}

/**
 * Performs topological sort to detect cycles and get execution order
 */
export function topologicalSort(nodes: Node[], edges: Edge[]): {
  sorted: string[];
  hasCycle: boolean;
  cycles: string[][];
} {
  const adjacencyList = buildAdjacencyList(nodes, edges);
  const inDegree = new Map<string, number>();

  // Initialize in-degree for all nodes
  for (const node of nodes) {
    inDegree.set(node.id, 0);
  }

  // Calculate in-degrees
  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // Find nodes with no incoming edges
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

  const hasCycle = sorted.length !== nodes.length;
  const cycles = hasCycle ? detectCycles(nodes, edges) : [];

  return { sorted, hasCycle, cycles };
}

/**
 * Performs topological sort and returns sorted nodes array.
 * Throws an error if a cycle is detected.
 * This is a simplified version for workflow execution.
 * 
 * @param nodes - Array of workflow nodes
 * @param edges - Array of workflow edges
 * @returns Array of nodes in topological order
 * @throws Error if the graph contains a cycle
 */
export function topologicalSortNodes(nodes: Node[], edges: Edge[]): Node[] {
  const result = topologicalSort(nodes, edges);

  if (result.hasCycle) {
    const cycleDescription = result.cycles
      .map(cycle => cycle.join(' → '))
      .join('; ');
    throw new Error(`Workflow contains cycles: ${cycleDescription}`);
  }

  // Map sorted node IDs back to Node objects, preserving order
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  return result.sorted
    .map(nodeId => nodeMap.get(nodeId))
    .filter((node): node is Node => node !== undefined);
}

/**
 * Validates the entire workflow graph
 */
export function validateWorkflowGraph(nodes: Node[], edges: Edge[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check for cycles
  const { hasCycle, cycles } = topologicalSort(nodes, edges);
  if (hasCycle) {
    for (const cycle of cycles) {
      errors.push({
        type: 'cycle',
        message: `Cycle detected: ${cycle.join(' → ')}`,
        nodeIds: cycle,
      });
    }
  }

  // Check for trigger nodes
  const triggerNodes = nodes.filter(node =>
    node.type?.toLowerCase().includes('trigger') || (node.data as any)?.nodeType?.toLowerCase().includes('trigger')
  );

  if (triggerNodes.length === 0) {
    errors.push({
      type: 'missing_trigger',
      message: 'Workflow must have at least one trigger node',
    });
  }

  if (triggerNodes.length > 1) {
    warnings.push({
      type: 'no_outputs',
      message: 'Multiple trigger nodes detected. Only one will be used.',
      nodeIds: triggerNodes.map(n => n.id),
    });
  }

  // Check for orphaned nodes (nodes with no connections)
  const connectedNodes = new Set<string>();
  for (const edge of edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  const orphanedNodes = nodes.filter(node =>
    !connectedNodes.has(node.id) && nodes.length > 1
  );

  if (orphanedNodes.length > 0) {
    warnings.push({
      type: 'unreachable_node',
      message: `${orphanedNodes.length} node(s) are not connected to the workflow`,
      nodeIds: orphanedNodes.map(n => n.id),
    });
  }

  // Check for unreachable nodes (nodes that can't be reached from triggers)
  if (triggerNodes.length > 0 && triggerNodes[0]) {
    const reachableNodes = findReachableNodes(triggerNodes[0].id, nodes, edges);
    const unreachableNodes = nodes.filter(node =>
      !reachableNodes.has(node.id) && !triggerNodes.some(t => t.id === node.id)
    );

    if (unreachableNodes.length > 0) {
      warnings.push({
        type: 'unreachable_node',
        message: `${unreachableNodes.length} node(s) cannot be reached from the trigger`,
        nodeIds: unreachableNodes.map(n => n.id),
      });
    }
  }

  // Check for nodes with missing required configuration
  const nodesWithMissingConfig = nodes.filter(node => {
    const data = (node.data as any) || {};
    return !data.name || (typeof data.name === 'string' && data.name.trim() === '');
  });

  if (nodesWithMissingConfig.length > 0) {
    warnings.push({
      type: 'missing_config',
      message: `${nodesWithMissingConfig.length} node(s) are missing required configuration`,
      nodeIds: nodesWithMissingConfig.map(n => n.id),
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Finds all nodes reachable from a starting node
 */
function findReachableNodes(startNodeId: string, nodes: Node[], edges: Edge[]): Set<string> {
  const adjacencyList = buildAdjacencyList(nodes, edges);
  const reachable = new Set<string>();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (reachable.has(current)) continue;

    reachable.add(current);
    const neighbors = adjacencyList.get(current) || [];
    queue.push(...neighbors);
  }

  return reachable;
}

/**
 * Builds an adjacency list representation of the graph
 */
function buildAdjacencyList(nodes: Node[], edges: Edge[]): Map<string, string[]> {
  const adjacencyList = new Map<string, string[]>();

  // Initialize adjacency list for all nodes
  for (const node of nodes) {
    adjacencyList.set(node.id, []);
  }

  // Add edges to adjacency list
  for (const edge of edges) {
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);
  }

  return adjacencyList;
}

/**
 * Validates a specific connection before it's created
 */
export function validateConnection(
  nodes: Node[],
  edges: Edge[],
  connection: { source: string; target: string }
): { isValid: boolean; error?: string } {
  // Check if connection would create a cycle
  if (wouldCreateCycle(nodes, edges, connection)) {
    return {
      isValid: false,
      error: 'This connection would create a cycle in the workflow',
    };
  }

  // Check if connection already exists
  const existingEdge = edges.find(
    edge => edge.source === connection.source && edge.target === connection.target
  );

  if (existingEdge) {
    return {
      isValid: false,
      error: 'Connection already exists between these nodes',
    };
  }

  // Check for self-loops
  if (connection.source === connection.target) {
    return {
      isValid: false,
      error: 'Cannot connect a node to itself',
    };
  }

  return { isValid: true };
}