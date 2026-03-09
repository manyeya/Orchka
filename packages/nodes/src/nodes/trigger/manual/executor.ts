import { NodeExecutor } from "../../utils/execution/types";

export const manualTriggerExecutor: NodeExecutor = async ({
    context,
}) => {
    // Manual trigger simply passes through the initial context (input data)
    return context;
}