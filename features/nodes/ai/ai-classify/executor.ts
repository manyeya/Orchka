/**
 * AI Classify Executor
 * Uses AI SDK v6 generateObject for classification with enum output
 */
import { generateObject } from "ai";
import { NonRetriableError } from "inngest";
import { z } from "zod";
import type { NodeExecutor, WorkflowContext } from "../../utils/execution/types";
import type { AIClassifySettings } from "./types";
import { publishNodeStatus } from "../../utils/realtime";
import { NodeType } from "@/features/nodes/types";
import { createAIModelAsync, extractAICredentialConfig } from "../shared/model-factory";

export const aiClassifyExecutor: NodeExecutor<AIClassifySettings> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
  resolveCredential,
}): Promise<WorkflowContext> => {
  await publishNodeStatus(publish, nodeId, "loading", NodeType.AI_CLASSIFY, undefined, step);

  const nodeName = data.name || "AI Classify";
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

    // Build categories description for system prompt
    const categoriesDescription = data.categories
      .map(c => `- ${c.value}: ${c.description || c.label}`)
      .join("\n");

    const systemPrompt = `${data.systemPrompt}

Available categories:
${categoriesDescription}`;

    // Build schema based on settings
    const categoryValues = data.categories.map(c => c.value) as [string, ...string[]];
    
    const schemaShape: Record<string, z.ZodTypeAny> = {
      category: z.enum(categoryValues).describe("The classification category"),
    };

    if (data.includeConfidence) {
      schemaShape.confidence = z.number().min(0).max(1).describe("Confidence score between 0 and 1");
    }

    if (data.includeReasoning) {
      schemaShape.reasoning = z.string().describe("Brief explanation for the classification");
    }

    const schema = z.object(schemaShape);

    // Execute AI classification within a step for durability
    const result = await step.run(stepName, async () => {
      const model = await createAIModelAsync(data.model, credentialConfig);

      const response = await generateObject({
        model,
        system: systemPrompt,
        prompt: input,
        schema,
        temperature: data.temperature,
      });

      return {
        object: response.object,
        usage: response.usage,
      };
    });

    await publishNodeStatus(publish, nodeId, "success", NodeType.AI_CLASSIFY, undefined, step);

    // Type the result object
    const resultObject = result.object as {
      category: string;
      confidence?: number;
      reasoning?: string;
    };

    // Find the category label
    const categoryInfo = data.categories.find(c => c.value === resultObject.category);

    return {
      ...context,
      [nodeName]: {
        category: resultObject.category,
        label: categoryInfo?.label || resultObject.category,
        confidence: resultObject.confidence,
        reasoning: resultObject.reasoning,
        usage: result.usage,
      },
    };
  } catch (error) {
    await publishNodeStatus(publish, nodeId, "error", NodeType.AI_CLASSIFY, undefined, step);
    throw error;
  }
};

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
