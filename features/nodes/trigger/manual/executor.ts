import { NodeType } from "@/lib/generated/prisma/enums";
import { NodeExecutor } from "../../utils/execution/types";
import { publishNodeStatus } from "../../utils/realtime";

export const manualTriggerExecutor: NodeExecutor = async ({
    data,
    nodeId,
    context,
    step,
    publish
}) => {
    await publishNodeStatus(publish, nodeId, "loading", NodeType.MANUAL_TRIGGER)
    //TODO: Publish Loading State
    const result = await step.run('manual-trigger', async () => context)
    await publishNodeStatus(publish, nodeId, "success", NodeType.MANUAL_TRIGGER)
    return result;
}