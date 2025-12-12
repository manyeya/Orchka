import { NodeExecutor } from "../../utils/execution/types";

export const manualTriggerExecutor: NodeExecutor = async ({
    data,
    nodeId,
    context,
    step
}) => {
    //TODO: Publish Loading State
    const result = await step.run('manual-trigger', async () => context)

    return result;
}