import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
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

interface WorkflowContext {
  workflowId: string;
  workflowName: string;
  versionId: string | null;
  versionNumber: number;
  versionStatus: string | null;
  isActiveVersion: boolean;
}

interface WorkflowBuilderState {
  // Core state
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  
  // Workflow context
  workflowContext: WorkflowContext | null;
  
  // Execution state
  currentRunId: string | null;
  
  // History management
  history: HistoryState[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Dirty state tracking
  isDirty: boolean;
  lastSavedState: { nodes: Node[]; edges: Edge[] } | null;
  
  // Autosave
  autosaveTimeout: NodeJS.Timeout | null;
  autosaveDelay: number;
  
  // Validation
  validationResult: ValidationResult | null;
  
  // Drag and Drop state
  dragData: {
    stepId: string;
    path: string;
    value: any;
    displayPath: string;
  } | null;
  isDragging: boolean;
}

interface WorkflowBuilderActions {
  // Node and edge operations
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  
  // Selection
  setSelectedNodeId: (id: string | null) => void;
  
  // Workflow context
  setWorkflowContext: (context: WorkflowContext) => void;
  
  // Execution state
  setCurrentRunId: (runId: string | null) => void;
  
  // History management
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushToHistory: () => void;
  
  // Save operations
  save: () => Promise<void>;
  markClean: () => void;
  
  // Validation
  validateGraph: () => ValidationResult;
  
  // Import/Export
  exportWorkflow: (filename?: string) => void;
  importWorkflow: () => Promise<ImportResult>;
  
  // Initialization
  loadWorkflow: (nodes: Node[], edges: Edge[]) => void;
  reset: () => void;
  
  // Drag and Drop actions
  setDragData: (data: { stepId: string; path: string; value: any; displayPath: string } | null) => void;
  createExpressionFromDrag: (inputId: string, dragData: { stepId: string; path: string; value: any; displayPath: string }) => void;
}

type WorkflowBuilderStore = WorkflowBuilderState & WorkflowBuilderActions;

const initialState: WorkflowBuilderState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  workflowContext: null,
  currentRunId: null,
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
  isDirty: false,
  lastSavedState: null,
  autosaveTimeout: null,
  autosaveDelay: 2000, // 2 seconds
  validationResult: null,
  dragData: null,
  isDragging: false,
};

export const useWorkflowBuilder = create<WorkflowBuilderStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    onNodesChange: (changes: NodeChange[]) => {
      set((state) => {
        const newNodes = applyNodeChanges(changes, state.nodes);
        return {
          nodes: newNodes,
          isDirty: true,
        };
      });
      get().pushToHistory();
    },

    onEdgesChange: (changes: EdgeChange[]) => {
      set((state) => {
        const newEdges = applyEdgeChanges(changes, state.edges);
        return {
          edges: newEdges,
          isDirty: true,
        };
      });
      get().pushToHistory();
    },

    onConnect: (connection: Connection) => {
      const { nodes, edges } = get();
      
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
      
      set((state) => {
        const newEdges = addEdge(connection, state.edges);
        const validationResult = validateWorkflowGraph(state.nodes, newEdges);
        return {
          edges: newEdges,
          isDirty: true,
          validationResult,
        };
      });
      get().pushToHistory();
    
    },

    addNode: (node: Node) => {
      set((state) => ({
        nodes: [...state.nodes, node],
        isDirty: true,
      }));
      get().pushToHistory();
    },

    updateNode: (id: string, updates: Partial<Node>) => {
      set((state) => ({
        nodes: state.nodes.map((node) =>
          node.id === id ? { ...node, ...updates } : node
        ),
        isDirty: true,
      }));
      get().pushToHistory();
    },

    deleteNode: (id: string) => {
      set((state) => ({
        nodes: state.nodes.filter((node) => node.id !== id),
        edges: state.edges.filter(
          (edge) => edge.source !== id && edge.target !== id
        ),
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        isDirty: true,
      }));
      get().pushToHistory();
    },

    setSelectedNodeId: (id: string | null) => {
      console.log('Setting selected node ID:', id);
      set({ selectedNodeId: id });
    },

    setWorkflowContext: (context: WorkflowContext) => {
      set({ workflowContext: context });
    },

    setCurrentRunId: (runId: string | null) => {
      set({ currentRunId: runId });
    },

    pushToHistory: () => {
      const { nodes, edges, history, historyIndex, maxHistorySize } = get();
      
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
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const previousState = history[historyIndex - 1];
        set({
          nodes: JSON.parse(JSON.stringify(previousState.nodes)),
          edges: JSON.parse(JSON.stringify(previousState.edges)),
          historyIndex: historyIndex - 1,
          isDirty: true,
        });
      }
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const nextState = history[historyIndex + 1];
        set({
          nodes: JSON.parse(JSON.stringify(nextState.nodes)),
          edges: JSON.parse(JSON.stringify(nextState.edges)),
          historyIndex: historyIndex + 1,
          isDirty: true,
        });
      }
    },

    canUndo: () => {
      const { historyIndex } = get();
      return historyIndex > 0;
    },

    canRedo: () => {
      const { history, historyIndex } = get();
      return historyIndex < history.length - 1;
    },

    scheduleAutosave: () => {
      const { autosaveTimeout, autosaveDelay } = get();
      
      // Clear existing timeout
      if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
      }

      // Schedule new autosave
      const newTimeout = setTimeout(() => {
        get().save();
      }, autosaveDelay);

      set({ autosaveTimeout: newTimeout });
    },

    save: async () => {
      const { nodes, edges, autosaveTimeout, workflowContext } = get();
      
      // Clear autosave timeout
      if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
        set({ autosaveTimeout: null });
      }

      if (!workflowContext) {
        console.error('Cannot save: No workflow context');
        return;
      }

      try {
        let versionId = workflowContext.versionId;

        // If no version exists yet, or if we're editing an active version, create a new draft
        if (!versionId || workflowContext.versionStatus === 'ACTIVE') {
          const createResponse = await fetch(`/api/workflows/${workflowContext.workflowId}/versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!createResponse.ok) {
            throw new Error('Failed to create draft version');
          }

          const newVersion = await createResponse.json();
          versionId = newVersion.id;

          // Update context with new draft version
          set({
            workflowContext: {
              ...workflowContext,
              versionId: newVersion.id,
              versionNumber: newVersion.version,
              versionStatus: 'DRAFT',
              isActiveVersion: false,
            },
          });
        }

        // Save nodes and edges to the version
        console.log('Saving workflow version:', { versionId, nodesCount: nodes.length, edgesCount: edges.length });
        
        const saveResponse = await fetch(`/api/versions/${versionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes, edges }),
        });

        console.log('Save response status:', saveResponse.status, saveResponse.statusText);

        if (!saveResponse.ok) {
          let errorData: any = {};
          const responseText = await saveResponse.text();
          console.log('Error response text:', responseText);
          
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            console.error('Failed to parse error response as JSON');
          }
          
          console.error('Save workflow version failed:', {
            status: saveResponse.status,
            statusText: saveResponse.statusText,
            error: errorData,
            responseText,
          });
          
          throw new Error(
            errorData.error || 
            (Array.isArray(errorData.details) ? errorData.details.join(', ') : errorData.details) ||
            `Failed to save workflow version: ${saveResponse.status} ${saveResponse.statusText}`
          );
        }

        get().markClean();
      } catch (error) {
        console.error('Failed to save workflow:', error);
        throw error;
      }
    },

    markClean: () => {
      const { nodes, edges } = get();
      set({
        isDirty: false,
        lastSavedState: {
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        },
      });
    },

    loadWorkflow: (nodes: Node[], edges: Edge[]) => {
      set({
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        selectedNodeId: null,
        history: [],
        historyIndex: -1,
        isDirty: false,
        lastSavedState: {
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        },
      });
      
      // Add initial state to history
      get().pushToHistory();
    },

    validateGraph: () => {
      const { nodes, edges } = get();
      const validationResult = validateWorkflowGraph(nodes, edges);
      set({ validationResult });
      return validationResult;
    },

    exportWorkflow: (filename?: string) => {
      const { nodes, edges } = get();
      downloadWorkflow(nodes, edges, filename);
    },

    importWorkflow: async () => {
      try {
        const result = await uploadWorkflow();
        
        if (result.success && result.nodes && result.edges) {
          get().loadWorkflow(result.nodes, result.edges);
        }
        
        return result;
      } catch (error) {
        return {
          success: false,
          errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        };
      }
    },

    reset: () => {
      const { autosaveTimeout } = get();
      
      // Clear autosave timeout
      if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
      }
      
      set(initialState);
    },

    // Drag and Drop actions
    setDragData: (data) => {
      set({ 
        dragData: data, 
        isDragging: !!data 
      });
    },

    createExpressionFromDrag: (inputId, dragData) => {
      // Create expression using bracket notation for node IDs with special characters
      const expression = `{{ $json["${dragData.stepId}"].${dragData.path} }}`;
      
      // Dispatch custom event that ExpressionInput components can listen to
      window.dispatchEvent(new CustomEvent('expressionDrop', {
        detail: { inputId, expression }
      }));
      
      // Clear drag state
      set({ dragData: null, isDragging: false });
    },
  }))
);

// Subscribe to store changes for debugging
if (process.env.NODE_ENV === 'development') {
  useWorkflowBuilder.subscribe(
    (state) => ({ nodes: state.nodes, edges: state.edges, isDirty: state.isDirty }),
    (current, previous) => {
      console.log('Workflow state changed:', {
        nodeCount: current.nodes.length,
        edgeCount: current.edges.length,
        isDirty: current.isDirty,
        previousNodeCount: previous.nodes.length,
        previousEdgeCount: previous.edges.length,
      });
    }
  );
}