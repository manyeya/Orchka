/**
 * AI Extract Executor
 * Uses AI SDK v6 generateObject with Inngest step.ai.wrap() for structured extraction
 */
import { generateObject } from "ai";
import { NonRetriableError } from "inngest";
import { z } from "zod";
import type { NodeExecutor, WorkflowContext } from "../../utils/execution/types";
import type { AIExtractSettings } from "./types";
import { publishNodeStatus } from "../../utils/realtime";
import { NodeType } from "@/features/nodes/types";
import { createAIModelAsync, extractAICredentialConfig } from "../shared/model-factory";

export const aiExtractExecutor: NodeExecutor<AIExtractSettings> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
  resolveCredential,
}): Promise<WorkflowContext> => {
  await publishNodeStatus(publish, nodeId, "loading", NodeType.AI_EXTRACT, undefined, step);

  const nodeName = data.name || "AI Extract";
  const stepName = `${nodeName} (${nodeId})`;

  try {
    // Resolve credential
    let credentialConfig = null;
    if (data.credentialId && resolveCredential) {
      const credential = await resolveCredential(data.credentialId);
      credentialConfig = extractAICredentialConfig(credential, data.model);
    }

    // Resolve input
    let input: string;
    if (data.prompt && data.prompt.trim()) {
      input = data.prompt;
    } else if (data.inputVariable && data.inputVariable.trim()) {
      const resolved = resolveInput(data.inputVariable, context);
      if (!resolved) {
        throw new NonRetriableError(`Input variable "${data.inputVariable}" not found`);
      }
      input = typeof resolved === "string" ? resolved : JSON.stringify(resolved);
    } else {
      throw new NonRetriableError("No prompt or input variable configured");
    }

    // Parse JSON schema to Zod schema
    const zodSchema = jsonSchemaToZod(data.outputSchema);

    // Execute AI extraction within a step for durability
    const result = await step.run(stepName, async () => {
      const model = await createAIModelAsync(data.model, credentialConfig);

      const response = await generateObject({
        model,
        system: data.systemPrompt,
        prompt: input,
        schema: zodSchema,
        temperature: data.temperature,
      });

      return {
        object: response.object,
        usage: response.usage,
      };
    });

    await publishNodeStatus(publish, nodeId, "success", NodeType.AI_EXTRACT, undefined, step);

    return {
      ...context,
      [nodeName]: result,
    };
  } catch (error) {
    await publishNodeStatus(publish, nodeId, "error", NodeType.AI_EXTRACT, undefined, step);
    throw error;
  }
};

/**
 * Convert JSON Schema to Zod schema
 * Supports basic types: string, number, boolean, array, object
 */
function jsonSchemaToZod(schemaString: string): z.ZodTypeAny {
  try {
    const schema = JSON.parse(schemaString);
    return convertToZod(schema);
  } catch {
    // Fallback to a generic object schema
    return z.object({ result: z.unknown() });
  }
}

function convertToZod(schema: any): z.ZodTypeAny {
  if (!schema || typeof schema !== "object") {
    return z.unknown();
  }

  const { type, properties, items, required = [], nullable, enum: enumValues } = schema;

  // Handle enum
  if (enumValues && Array.isArray(enumValues)) {
    const enumSchema = z.enum(enumValues as [string, ...string[]]);
    return nullable ? enumSchema.nullable() : enumSchema;
  }

  switch (type) {
    case "string": {
      const base = z.string();
      return nullable ? base.nullable() : base;
    }
    case "number":
    case "integer": {
      const base = z.number();
      return nullable ? base.nullable() : base;
    }
    case "boolean": {
      const base = z.boolean();
      return nullable ? base.nullable() : base;
    }
    case "array": {
      const itemSchema = items ? convertToZod(items) : z.unknown();
      const base = z.array(itemSchema);
      return nullable ? base.nullable() : base;
    }
    case "object": {
      if (!properties) {
        return z.record(z.unknown());
      }
      const shape: Record<string, z.ZodTypeAny> = {};
      for (const [key, propSchema] of Object.entries(properties)) {
        let fieldSchema = convertToZod(propSchema);
        if (!required.includes(key)) {
          fieldSchema = fieldSchema.optional();
        }
        shape[key] = fieldSchema;
      }
      return z.object(shape);
    }
    default:
      return z.unknown();
  }
}

function resolveInput(inputVariable: string, context: WorkflowContext): unknown {
  if (context[inputVariable] !== undefined) {
    return context[inputVariable];
  }
  const parts = inputVariable.split(".");
  let value: unknown = context;
  for (const part of parts) {
    if (value && typeof value === "object" && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return value;
}
