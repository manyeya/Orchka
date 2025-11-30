import { Node, Edge } from '@xyflow/react';
import { z } from 'zod';
import { validateWorkflowGraph } from './graph-validation';

// Schema for validating imported workflow JSON
const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.string(), z.unknown()),
});

const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

const workflowSchema = z.object({
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
  metadata: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    version: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  }).optional(),
});

export type WorkflowExport = z.infer<typeof workflowSchema>;

export interface ImportResult {
  success: boolean;
  nodes?: Node[];
  edges?: Edge[];
  errors?: string[];
  warnings?: string[];
}

export interface ExportOptions {
  includeMetadata?: boolean;
  includePositions?: boolean;
  prettyPrint?: boolean;
}

/**
 * Exports workflow to JSON format
 */
export function exportWorkflow(
  nodes: Node[],
  edges: Edge[],
  options: ExportOptions = {}
): string {
  const {
    includeMetadata = true,
    includePositions = true,
    prettyPrint = true,
  } = options;

  // Clean up nodes for export
  const exportNodes = nodes.map((node) => {
    const exportNode: any = {
      id: node.id,
      type: node.type,
      data: { ...node.data },
    };

    if (includePositions) {
      exportNode.position = node.position;
    }

    // Remove internal properties that shouldn't be exported
    delete exportNode.data.selected;
    delete exportNode.data.dragging;

    return exportNode;
  });

  // Clean up edges for export
  const exportEdges = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? undefined,
    targetHandle: edge.targetHandle ?? undefined,
  }));

  const exportData: WorkflowExport = {
    nodes: exportNodes,
    edges: exportEdges,
  };

  if (includeMetadata) {
    exportData.metadata = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return JSON.stringify(exportData, null, prettyPrint ? 2 : 0);
}

/**
 * Imports workflow from JSON format
 */
export function importWorkflow(jsonString: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Parse JSON
    let data: any;
    try {
      data = JSON.parse(jsonString);
    } catch (parseError) {
      return {
        success: false,
        errors: ['Invalid JSON format'],
      };
    }

    // Validate schema
    const validationResult = workflowSchema.safeParse(data);
    if (!validationResult.success) {
      const schemaErrors = validationResult.error.issues.map(
        (err: any) => `${err.path.join('.')}: ${err.message}`
      );
      return {
        success: false,
        errors: ['Schema validation failed', ...schemaErrors],
      };
    }

    const { nodes: importNodes, edges: importEdges } = validationResult.data;

    // Validate node types
    const validNodes: Node[] = [];
    for (const node of importNodes) {
      // TODO: Re-enable node type validation when nodeTypes is properly imported
      // const nodeType = nodeTypes[node.type];
      // if (!nodeType) {
      //   warnings.push(`Unknown node type: ${node.type} (node ${node.id})`);
      //   continue;
      // }

      // // Validate node configuration
      // const configValidation = nodeType.configSchema.safeParse(node.data);
      // if (!configValidation.success) {
      //   warnings.push(
      //     `Invalid configuration for node ${node.id}: ${configValidation.error.issues
      //       .map((err: any) => err.message)
      //       .join(', ')}`
      //   );

      //   // Use default config for invalid nodes
      //   node.data = { ...nodeType.defaultConfig, ...node.data };
      // }

      validNodes.push({
        id: node.id,
        type: node.type,
        position: node.position || { x: 0, y: 0 },
        data: node.data,
      });
    }

    // Validate edges
    const nodeIds = new Set(validNodes.map((n) => n.id));
    const validEdges: Edge[] = [];

    for (const edge of importEdges) {
      if (!nodeIds.has(edge.source)) {
        warnings.push(`Edge ${edge.id} references unknown source node: ${edge.source}`);
        continue;
      }

      if (!nodeIds.has(edge.target)) {
        warnings.push(`Edge ${edge.id} references unknown target node: ${edge.target}`);
        continue;
      }

      validEdges.push({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle ?? null,
        targetHandle: edge.targetHandle ?? null,
      });
    }

    // Validate workflow graph
    const graphValidation = validateWorkflowGraph(validNodes, validEdges);
    if (!graphValidation.isValid) {
      errors.push(...graphValidation.errors.map((err) => err.message));
    }

    if (graphValidation.warnings.length > 0) {
      warnings.push(...graphValidation.warnings.map((warn) => warn.message));
    }

    const result: ImportResult = {
      success: errors.length === 0,
      nodes: validNodes,
      edges: validEdges,
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    if (warnings.length > 0) {
      result.warnings = warnings;
    }

    return result;
  } catch (error) {
    return {
      success: false,
      errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Downloads workflow as JSON file
 */
export function downloadWorkflow(
  nodes: Node[],
  edges: Edge[],
  filename: string = 'workflow.json',
  options?: ExportOptions
): void {
  const jsonString = exportWorkflow(nodes, edges, options);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Uploads and imports workflow from file
 */
export function uploadWorkflow(): Promise<ImportResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve({
          success: false,
          errors: ['No file selected'],
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const result = importWorkflow(content);
        resolve(result);
      };

      reader.onerror = () => {
        resolve({
          success: false,
          errors: ['Failed to read file'],
        });
      };

      reader.readAsText(file);
    };

    input.click();
  });
}

/**
 * Validates workflow export format
 */
export function validateWorkflowExport(jsonString: string): {
  isValid: boolean;
  errors: string[];
} {
  try {
    const data = JSON.parse(jsonString);
    const result = workflowSchema.safeParse(data);

    if (result.success) {
      return { isValid: true, errors: [] };
    } else {
      return {
        isValid: false,
        errors: result.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`),
      };
    }
  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid JSON format'],
    };
  }
}