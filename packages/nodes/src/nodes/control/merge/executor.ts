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

  // Convert sources array to indexed format for JSONata expressions
  // $input1, $input2, $input3, etc.
  const inputBindings: Record<string, unknown> = {};
  const sourceValues = Object.values(sourcesData);
  for (let i = 0; i < sourceValues.length; i++) {
    inputBindings[`$input${i + 1}`] = sourceValues[i];
  }

  let result: unknown;
  const numInputs = sourceValues.length;

  try {
    switch (data.mode) {
      case "append": {
        // Use JSONata $append to concatenate arrays
        const expr = `$append(${Array.from({ length: numInputs }, (_, i) => `$input${i + 1}`).join(", ")})`;
        logger.info({ nodeId, expr, inputBindings }, "Merge Node: Append expression");
        result = await evaluateJsonata(expr, inputBindings);
        break;
      }

      case "mergeByKey": {
        if (!data.keyField) {
          logger.warn("Merge Node: mergeByKey mode requires keyField, defaulting to append");
          result = await evaluateJsonata("$append($input1, $input2)", inputBindings);
        } else {
          // Use JSONata to merge by key - group by key field and merge matching records
          const expr = buildMergeByKeyExpression(data.keyField, numInputs);
          logger.info({ nodeId, keyField: data.keyField, expr }, "Merge Node: Merge by key expression");
          result = await evaluateJsonata(expr, inputBindings);
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
        for (let i = numInputs - 1; i >= 0; i--) {
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
        // Use JSONata $merge to merge objects
        const expr = `$merge([${Array.from({ length: numInputs }, (_, i) => `$input${i + 1}`).join(", ")}])`;
        logger.info({ nodeId, expr }, "Merge Node: Combine expression");
        result = await evaluateJsonata(expr, inputBindings);
        break;
      }

      case "custom": {
        if (!data.expression) {
          logger.warn("Merge Node: custom mode requires expression, defaulting to append");
          result = await evaluateJsonata("$append($input1, $input2)", inputBindings);
        } else {
          logger.info({ nodeId, expression: data.expression }, "Merge Node: Custom expression");
          result = await evaluateJsonata(data.expression, inputBindings);
        }
        break;
      }

      default: {
        logger.warn({ mode: data.mode }, "Merge Node: Unknown mode, defaulting to append");
        result = await evaluateJsonata("$append($input1, $input2)", inputBindings);
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

/**
 * Build a JSONata expression for merge-by-key operation
 * Creates a lookup from first array and merges matching records from other arrays
 */
function buildMergeByKeyExpression(keyField: string, numInputs: number): string {
  if (numInputs === 2) {
    // For 2 inputs: use $lookup to find matching records
    return `
      $input1.({
        "$": $,
        "matched": $input2.${keyField} = ${keyField}
      }).($$.matched).($.$)
    `.trim();
  }

  // For 3+ inputs: iterative merge
  return `
    $result := $input1.({
      "key": ${keyField},
      "$": $
    });
    $each($input2, function($v) {
      $key := $v.${keyField};
      $lookup := $result.key = $key;
      $merge([$lookup, $v])
    });
  `.trim();
}
