import { atom } from 'jotai';
import {
  Node,
  Edge,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { validateConnection, validateWorkflowGraph, ValidationResult } from './utils/graph-validation';
import { downloadWorkflow, uploadWorkflow } from './utils/import-export';
import { toast } from 'sonner';
import { NodeType } from '@/config/node-components';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

// ============================================================================
// Primitive Atoms (Base State)
// ============================================================================

export const nodesAtom = atom<Node[]>([]);
export const edgesAtom = atom<Edge[]>([]);
export const selectedNodeIdAtom = atom<string | null>(null);
/** ID of the node whose modal is currently open */
export const activeNodeModalIdAtom = atom<string | null>(null);
/** @deprecated Use activeNodeModalIdAtom instead */
export const activeSettingsNodeIdAtom = activeNodeModalIdAtom;

export const currentRunIdAtom = atom<string | null>(null);
export const historyAtom = atom<HistoryState[]>([]);
export const historyIndexAtom = atom<number>(-1);
export const isDirtyAtom = atom<boolean>(false);
export const lastSavedStateAtom = atom<{ nodes: Node[]; edges: Edge[] } | null>(null);

export const validationResultAtom = atom<ValidationResult | null>(null);
export const dragDataAtom = atom<{
  stepId: string;
  path: string;
  value: any;
  displayPath: string;
} | null>(null);

/** Stores execution data (input/output) per node, keyed by nodeId */
export interface NodeExecutionData {
  input: unknown;
  output: unknown;
  timestamp: number;
}
export const nodeExecutionDataAtom = atom<Record<string, NodeExecutionData>>({});

// Constants
const MAX_HISTORY_SIZE = 50;

// ============================================================================
// Derived Atoms (Computed Values)
// ============================================================================

export const isDraggingAtom = atom((get) => !!get(dragDataAtom));

export const canUndoAtom = atom((get) => get(historyIndexAtom) > 0);

export const canRedoAtom = atom((get) => {
  const history = get(historyAtom);
  const historyIndex = get(historyIndexAtom);
  return historyIndex < history.length - 1;
});

// ============================================================================
// Action Atoms (Operations)
// ============================================================================

export const onNodesChangeAtom = atom(
  null,
  (get, set, changes: NodeChange[]) => {
    const currentNodes = get(nodesAtom);

    // Handle Group Node Deletion: Detach children instead of deleting them
    let nodesToProcess = currentNodes;
    const nodesToRemove = changes.filter(c => c.type === 'remove').map(c => c.id);

    if (nodesToRemove.length > 0) {
      // Find groups being deleted
      const deletedGroups = currentNodes.filter(n => nodesToRemove.includes(n.id) && n.type === NodeType.GROUP);

      if (deletedGroups.length > 0) {
        nodesToProcess = currentNodes.map(node => {
          // If this node is a child of a deleted group, detach it
          if (node.parentId && nodesToRemove.includes(node.parentId)) {
            const parent = currentNodes.find(n => n.id === node.parentId);
            if (parent) {
              return {
                ...node,
                parentId: undefined,
                extent: undefined,
                position: {
                  x: node.position.x + parent.position.x,
                  y: node.position.y + parent.position.y
                }
              }
            }
          }
          return node;
        });
      }
    }

    const newNodes = applyNodeChanges(changes, nodesToProcess);
    set(nodesAtom, newNodes);
    set(isDirtyAtom, true);
    set(pushToHistoryAtom);
  }
);

export const onEdgesChangeAtom = atom(
  null,
  (get, set, changes: EdgeChange[]) => {
    const currentEdges = get(edgesAtom);
    const newEdges = applyEdgeChanges(changes, currentEdges);
    set(edgesAtom, newEdges);
    set(isDirtyAtom, true);
    set(pushToHistoryAtom);
  }
);

export const onConnectAtom = atom(
  null,
  (get, set, connection: Connection) => {
    const nodes = get(nodesAtom);
    const edges = get(edgesAtom);

    // Validate connection before adding
    const validation = validateConnection(nodes, edges, {
      source: connection.source!,
      target: connection.target!,
    });

    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    const newEdges = addEdge(connection, edges);
    const validationResult = validateWorkflowGraph(nodes, newEdges);

    set(edgesAtom, newEdges);
    set(isDirtyAtom, true);
    set(validationResultAtom, validationResult);
    set(pushToHistoryAtom);
  }
);

export const addNodeAtom = atom(
  null,
  (get, set, node: Node) => {
    const currentNodes = get(nodesAtom);
    set(nodesAtom, [...currentNodes, node]);
    set(isDirtyAtom, true);
    set(pushToHistoryAtom);
  }
);

export const updateNodeAtom = atom(
  null,
  (get, set, { id, updates }: { id: string; updates: Partial<Node> }) => {
    const currentNodes = get(nodesAtom);
    const newNodes = currentNodes.map((node) =>
      node.id === id ? { ...node, ...updates } : node
    );
    set(nodesAtom, newNodes);
    set(isDirtyAtom, true);
    set(pushToHistoryAtom);
  }
);

export const deleteNodeAtom = atom(
  null,
  (get, set, id: string) => {
    const currentNodes = get(nodesAtom);
    const currentEdges = get(edgesAtom);
    const selectedNodeId = get(selectedNodeIdAtom);

    // Detach children if deleting a group
    let nodesToProcess = currentNodes;
    const nodeToDelete = currentNodes.find(n => n.id === id);
    if (nodeToDelete && nodeToDelete.type === NodeType.GROUP) {
      nodesToProcess = currentNodes.map(node => {
        if (node.parentId === id) {
          return {
            ...node,
            parentId: undefined,
            extent: undefined,
            position: {
              x: node.position.x + nodeToDelete.position.x,
              y: node.position.y + nodeToDelete.position.y
            }
          }
        }
        return node;
      })
    }

    const newNodes = nodesToProcess.filter((node) => node.id !== id);
    const newEdges = currentEdges.filter(
      (edge) => edge.source !== id && edge.target !== id
    );

    set(nodesAtom, newNodes);
    set(edgesAtom, newEdges);
    if (selectedNodeId === id) {
      set(selectedNodeIdAtom, null);
    }
    set(isDirtyAtom, true);
    set(pushToHistoryAtom);
  }
);

export const pushToHistoryAtom = atom(
  null,
  (get, set) => {
    const nodes = get(nodesAtom);
    const edges = get(edgesAtom);
    const history = get(historyAtom);
    const historyIndex = get(historyIndexAtom);

    // Don't add to history if nothing changed
    const currentState = { nodes, edges };
    const lastHistoryState = history[historyIndex];
    if (
      lastHistoryState &&
      JSON.stringify(currentState) === JSON.stringify({
        nodes: lastHistoryState.nodes,
        edges: lastHistoryState.edges,
      })
    ) {
      return;
    }

    const newHistoryState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now(),
    };

    // Remove any history after current index (when undoing then making new changes)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newHistoryState);

    // Limit history size
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
    }

    set(historyAtom, newHistory);
    set(historyIndexAtom, newHistory.length - 1);
  }
);

export const undoAtom = atom(
  null,
  (get, set) => {
    const history = get(historyAtom);
    const historyIndex = get(historyIndexAtom);

    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      set(nodesAtom, JSON.parse(JSON.stringify(previousState.nodes)));
      set(edgesAtom, JSON.parse(JSON.stringify(previousState.edges)));
      set(historyIndexAtom, historyIndex - 1);
      set(isDirtyAtom, true);
    }
  }
);

export const redoAtom = atom(
  null,
  (get, set) => {
    const history = get(historyAtom);
    const historyIndex = get(historyIndexAtom);

    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set(nodesAtom, JSON.parse(JSON.stringify(nextState.nodes)));
      set(edgesAtom, JSON.parse(JSON.stringify(nextState.edges)));
      set(historyIndexAtom, historyIndex + 1);
      set(isDirtyAtom, true);
    }
  }
);



export const markCleanAtom = atom(
  null,
  (get, set) => {
    const nodes = get(nodesAtom);
    const edges = get(edgesAtom);

    set(isDirtyAtom, false);
    set(lastSavedStateAtom, {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
  }
);

export const validateGraphAtom = atom(
  null,
  (get, set) => {
    const nodes = get(nodesAtom);
    const edges = get(edgesAtom);
    const validationResult = validateWorkflowGraph(nodes, edges);
    set(validationResultAtom, validationResult);
    return validationResult;
  }
);

export const exportWorkflowAtom = atom(
  null,
  (get, set, filename?: string) => {
    const nodes = get(nodesAtom);
    const edges = get(edgesAtom);
    downloadWorkflow(nodes, edges, filename);
  }
);

export const importWorkflowAtom = atom(
  null,
  async (get, set) => {
    try {
      const result = await uploadWorkflow();

      if (result.success && result.nodes && result.edges) {
        set(loadWorkflowAtom, { nodes: result.nodes, edges: result.edges });
      }

      return result;
    } catch (error) {
      return {
        success: false,
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }
);

export const loadWorkflowAtom = atom(
  null,
  (get, set, { nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
    const restoredNodes = nodes.map(node => {
      const data = node.data || {};
      // Check if we have persisted parentId/extent/style in data
      // Preserve existing style if it exists on the node or in data
      return {
        ...node,
        parentId: (data.parentId as string) || node.parentId || undefined,
        extent: (data.extent as string) || node.extent || undefined,
        style: (data.style as React.CSSProperties) || node.style || undefined,
      };
    });
    set(nodesAtom, JSON.parse(JSON.stringify(restoredNodes)));
    set(edgesAtom, JSON.parse(JSON.stringify(edges)));
    set(selectedNodeIdAtom, null);
    set(historyAtom, []);
    set(historyIndexAtom, -1);
    set(isDirtyAtom, false);
    set(lastSavedStateAtom, {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });

    // Add initial state to history
    set(pushToHistoryAtom);
  }
);

export const resetAtom = atom(
  null,
  (get, set) => {


    // Reset all state to initial values
    set(nodesAtom, []);
    set(edgesAtom, []);
    set(selectedNodeIdAtom, null);

    set(currentRunIdAtom, null);
    set(historyAtom, []);
    set(historyIndexAtom, -1);
    set(isDirtyAtom, false);
    set(lastSavedStateAtom, null);

    set(validationResultAtom, null);
    set(dragDataAtom, null);
  }
);

export const setDragDataAtom = atom(
  null,
  (get, set, data: { stepId: string; path: string; value: any; displayPath: string } | null) => {
    set(dragDataAtom, data);
  }
);

export const createExpressionFromDragAtom = atom(
  null,
  (get, set, { inputId, dragData }: { inputId: string; dragData: { stepId: string; path: string; value: any; displayPath: string } }) => {
    // Create expression usin js-style syntax: $("NodeName").item.json.path
    const expression = `{{ $("${dragData.stepId}").item.json.${dragData.path} }}`;

    // Dispatch custom event that ExpressionInput components can listen to
    window.dispatchEvent(new CustomEvent('expressionDrop', {
      detail: { inputId, expression }
    }));

    // Clear drag state
    set(dragDataAtom, null);
  }
);
