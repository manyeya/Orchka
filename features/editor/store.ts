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
import { exportWorkflow, importWorkflow, downloadWorkflow, uploadWorkflow, ImportResult } from './utils/import-export';

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
export const activeSettingsNodeIdAtom = atom<string | null>(null);

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
    const newNodes = applyNodeChanges(changes, currentNodes);
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
      console.warn('Connection rejected:', validation.error);
      // TODO: Show user notification
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

    const newNodes = currentNodes.filter((node) => node.id !== id);
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
    set(nodesAtom, JSON.parse(JSON.stringify(nodes)));
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
    // Create expression using bracket notation for node IDs with special characters
    const expression = `{{ $json["${dragData.stepId}"].${dragData.path} }}`;

    // Dispatch custom event that ExpressionInput components can listen to
    window.dispatchEvent(new CustomEvent('expressionDrop', {
      detail: { inputId, expression }
    }));

    // Clear drag state
    set(dragDataAtom, null);
  }
);

// ============================================================================
// Development Logging
// ============================================================================

if (process.env.NODE_ENV === 'development') {
  // You can use jotai-devtools or custom logging here if needed
  // For now, we'll remove the subscription-based logging
  console.log('Jotai store initialized');
}