import { logger } from "@orchka/nodes/core";
import type { NodeExecutor, WorkflowContext } from "../../utils/execution/types";
import type { MergeNodeData } from "../types";
import jsonata from "jsonata";

/**
 * Merge Node Executor
 *
 * Converges multiple workflow branches into a single output.
 * Uses JSONata expressions internally for powerful data merging.
 */
export const mergeNodeExecutor: NodeExecutor<MergeNodeData> = async ({
  data,
  nodeId,
  context,
}): Promise<WorkflowContext> => {
  const nodeName = data.name || "Merge";

  logger.info({ nodeId, nodeName, mode: data.mode, sources: data.sources }, "Merge Node: Executing");

  // Collect data from all sources (node outputs in context)
  const sourcesData: Record<string, unknown> = {};
  const foundSources: string[] = [];
  const missingSources: string[] = [];

  for (const source of data.sources || []) {
    // Source label should correspond to the node name in context
    const sourceData = context[source.label];
    if (sourceData !== undefined) {
      sourcesData[source.label] = sourceData;
      foundSources.push(source.label);
    } else {
      logger.warn({ nodeId, sourceLabel: source.label }, "Merge Node: Source not found in context");
      missingSources.push(source.label);
    }
  }

  logger.info({ nodeId, foundSources, missingSources }, "Merge Node: Source lookup results");

  // If no sources were found, return early
  if (foundSources.length === 0) {
    logger.error({ nodeId, configuredSources: data.sources?.map(s => s.label) }, "Merge Node: No configured sources found in context");
    return {
      ...context,
      [nodeName]: null,
    };
  }

  const sourceValues = Object.values(sourcesData);

  let result: unknown;

  try {
    switch (data.mode) {
      case "append": {
        result = appendInputs(sourceValues);
        break;
      }

      case "mergeByKey": {
        if (!data.keyField) {
          logger.warn("Merge Node: mergeByKey mode requires keyField, defaulting to append");
          result = appendInputs(sourceValues);
        } else {
          result = mergeArraysByKey(sourceValues, data.keyField, data.includeAllFields ?? true);
        }
        break;
      }

      case "keepFirst": {
        // Return first non-empty input
        result = sourceValues.find(v => v !== null && v !== undefined && v !== "") || null;
        break;
      }

      case "keepLast": {
        // Return last non-empty input
        for (let i = sourceValues.length - 1; i >= 0; i--) {
          const v = sourceValues[i];
          if (v !== null && v !== undefined && v !== "") {
            result = v;
            break;
          }
        }
        if (result === undefined) result = null;
        break;
      }

      case "combine": {
        result = combineObjects(sourceValues);
        break;
      }

      case "custom": {
        if (!data.expression) {
          logger.warn("Merge Node: custom mode requires expression, defaulting to append");
          result = appendInputs(sourceValues);
        } else {
          logger.info({ nodeId, expression: data.expression }, "Merge Node: Custom expression");
          result = await evaluateJsonata(data.expression, buildJsonataBindings(sourceValues, sourcesData));
        }
        break;
      }

      default: {
        logger.warn({ mode: data.mode }, "Merge Node: Unknown mode, defaulting to append");
        result = appendInputs(sourceValues);
        break;
      }
    }
  } catch (error) {
    logger.error({ nodeId, mode: data.mode, error }, "Merge Node: Execution error");
    // Return the raw sources data on error
    result = sourceValues.length === 1 ? sourceValues[0] : sourceValues;
  }

  logger.info({ nodeId, nodeName, mode: data.mode, result }, "Merge Node: Final merged data");

  return {
    ...context,
    [nodeName]: result,
  };
};

/**
 * Evaluate a JSONata expression with bindings
 */
async function evaluateJsonata(
  expression: string,
  bindings: Record<string, unknown>
): Promise<unknown> {
  try {
    const expr = jsonata(expression);
    return await expr.evaluate(bindings);
  } catch (error) {
    logger.error({ expression, error }, "Merge Node: JSONata evaluation error");
    throw error;
  }
}

function appendInputs(values: unknown[]): unknown[] {
  return values.flatMap((value) => Array.isArray(value) ? value : [value]);
}

function combineObjects(values: unknown[]): Record<string, unknown> {
  return values.reduce<Record<string, unknown>>((acc, value, index) => {
    if (isPlainObject(value)) {
      return { ...acc, ...value };
    }

    acc[`input${index + 1}`] = value;
    return acc;
  }, {});
}

function mergeArraysByKey(values: unknown[], keyField: string, includeAllFields: boolean): unknown[] {
  const rows = values.flatMap((value) => Array.isArray(value) ? value : [value]);
  const byKey = new Map<unknown, Record<string, unknown>>();
  const unmatched: unknown[] = [];

  for (const row of rows) {
    if (!isPlainObject(row)) {
      unmatched.push(row);
      continue;
    }

    const key = getByPath(row, keyField);
    if (key === undefined || key === null || key === "") {
      unmatched.push(row);
      continue;
    }

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...row });
      continue;
    }

    byKey.set(key, includeAllFields ? { ...existing, ...row } : { ...existing, ...pickDefined(row) });
  }

  return [...byKey.values(), ...unmatched];
}

function buildJsonataBindings(sourceValues: unknown[], sourcesData: Record<string, unknown>): Record<string, unknown> {
  const bindings: Record<string, unknown> = {
    inputs: sourceValues,
    sources: sourcesData,
  };

  sourceValues.forEach((value, index) => {
    bindings[`input${index + 1}`] = value;
  });

  return bindings;
}

function getByPath(value: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (!isPlainObject(current)) return undefined;
    return current[part];
  }, value);
}

function pickDefined(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
