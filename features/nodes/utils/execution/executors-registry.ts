import { NodeType } from "../../types";
import { NodeExecutor } from "./types";
import { manualTriggerExecutor } from "../../trigger/manual/executor";
import { httpsRequestExecutor } from "../../action/https-request/executor";
import { aiAgentExecutor } from "../../ai/ai-agent/executor";
import { aiGenerateExecutor } from "../../ai/ai-generate/executor";
import { aiExtractExecutor } from "../../ai/ai-extract/executor";
import { aiClassifyExecutor } from "../../ai/ai-classify/executor";
import { aiAgentExpExecutor } from "../../ai/ai-agent-exp/executor";
import { ifNodeExecutor } from "../../control/if/executor";
import { switchNodeExecutor } from "../../control/switch/executor";
import { loopNodeExecutor } from "../../control/loop/executor";
import { waitNodeExecutor } from "../../control/wait/executor";

export const executorsRegistry: Record<NodeType, NodeExecutor<any>> = {
    [NodeType.INITIAL]: () => Promise.resolve({}),
    [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor,
    [NodeType.HTTP_REQUEST]: httpsRequestExecutor,
    [NodeType.AI_AGENT]: aiAgentExecutor,
    [NodeType.AI_GENERATE]: aiGenerateExecutor,
    [NodeType.AI_EXTRACT]: aiExtractExecutor,
    [NodeType.AI_CLASSIFY]: aiClassifyExecutor,
    [NodeType.AI_AGENT_EXP]: aiAgentExpExecutor,
    [NodeType.IF_CONDITION]: ifNodeExecutor,
    [NodeType.SWITCH]: switchNodeExecutor,
    [NodeType.LOOP]: loopNodeExecutor,
    [NodeType.WAIT]: waitNodeExecutor,
    [NodeType.GROUP]: () => Promise.resolve({}),
    [NodeType.ANNOTATION]: () => Promise.resolve({}),
};

export const getExecutor = (type: NodeType): NodeExecutor<any> => {
    const executor = executorsRegistry[type];
    if (!executor) {
        throw new Error(`Executor not found for node type ${type}`);
    }
    return executor;
}
