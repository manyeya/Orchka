/**
 * AI Generate Executor
 * Uses AI SDK v6 for text generation
 */
import { generateText } from "ai";
import { NonRetriableError } from "@/lib/errors/workflow-errors";
import type { NodeExecutor, WorkflowContext } from "../../utils/execution/types";
import type { AIGenerateSettings } from "./types";
import { publishNodeStatus } from "../../utils/realtime";
import { NodeType } from "@/features/nodes/types";
import {
  createAIModelAsync,
  extractAICredentialConfig,
} from "../shared/model-factory";

export const aiGenerateExecutor: NodeExecutor<AIGenerateSettings> = async ({
  data,
  nodeId,
  context,
  publish,
  resolveCredential,
}): Promise<WorkflowContext> => {
  await publishNodeStatus(publish, nodeId, "loading", NodeType.AI_GENERATE);

  const nodeName = data.name || "AI Generate";

  try {
    // Resolve credential if configured
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
        throw new NonRetriableError(
          `Input variable "${data.inputVariable}" not found in context`
        );
      }
      input = String(resolved);
    } else {
      throw new NonRetriableError("No prompt or input variable configured");
    }

    // Create model and execute AI generation
    const model = await createAIModelAsync(data.model, credentialConfig);

    const response = await generateText({
      model,
      system: data.systemPrompt,
      prompt: input,
      temperature: data.temperature,
      ...(data.maxTokens && { maxOutputTokens: data.maxTokens }),
    });

    const result = {
      text: response.text,
      usage: response.usage,
      finishReason: response.finishReason,
    };

    await publishNodeStatus(publish, nodeId, "success", NodeType.AI_GENERATE);

    return {
      ...context,
      [nodeName]: result,
    };
  } catch (error) {
    await publishNodeStatus(publish, nodeId, "error", NodeType.AI_GENERATE);
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
