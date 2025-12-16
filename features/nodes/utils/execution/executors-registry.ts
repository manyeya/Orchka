import { NodeType } from "@/lib/generated/prisma/enums";
import { NodeExecutor } from "./types";
import { manualTriggerExecutor } from "../../trigger/manual/executor";
import { httpsRequestExecutor } from "../../action/https-request/executor";
import { ifNodeExecutor } from "../../control/if/executor";
import { switchNodeExecutor } from "../../control/switch/executor";
import { loopNodeExecutor } from "../../control/loop/executor";
import { waitNodeExecutor } from "../../control/wait/executor";

export const executorsRegistry: Record<NodeType, NodeExecutor<any>> = {
    [NodeType.INITIAL]: () => Promise.resolve({}),
    [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor,
    [NodeType.HTTP_REQUEST]: httpsRequestExecutor,
    [NodeType.IF_CONDITION]: ifNodeExecutor,
    [NodeType.SWITCH]: switchNodeExecutor,
    [NodeType.LOOP]: loopNodeExecutor,
    [NodeType.WAIT]: waitNodeExecutor,
};

export const getExecutor = (type: NodeType): NodeExecutor<any> => {
    const executor = executorsRegistry[type];
    if (!executor) {
        throw new Error(`Executor not found for node type ${type}`);
    }
    return executor;
}
