import { NodeType } from "../../../core/types";
import { NodeExecutor } from "./types";
import { manualTriggerExecutor } from "../../trigger/manual/executor";
import { cronTriggerExecutor } from "../../trigger/cron/executor";
import { httpsRequestExecutor } from "../../action/https-request/executor";
import { xPostExecutor } from "../../action/x-post/executor";
import { linkedInPostExecutor } from "../../action/linkedin-post/executor";
import { facebookPostExecutor } from "../../action/facebook-post/executor";
import { instagramPostExecutor } from "../../action/instagram-post/executor";
import { threadsPostExecutor } from "../../action/threads-post/executor";
import { discordMessageExecutor } from "../../action/discord-message/executor";
import { redditPostExecutor } from "../../action/reddit-post/executor";
import { blueskyPostExecutor } from "../../action/bluesky-post/executor";
import { mastodonPostExecutor } from "../../action/mastodon-post/executor";
import { pinterestPinExecutor } from "../../action/pinterest-pin/executor";
import { aiAgentExecutor } from "../../ai/ai-agent/executor";
import { aiGenerateExecutor } from "../../ai/ai-generate/executor";
import { aiExtractExecutor } from "../../ai/ai-extract/executor";
import { aiClassifyExecutor } from "../../ai/ai-classify/executor";
import { aiAgentExpExecutor } from "../../ai/ai-agent-exp/executor";
import { ifNodeExecutor } from "../../control/if/executor";
import { switchNodeExecutor } from "../../control/switch/executor";
import { loopNodeExecutor } from "../../control/loop/executor";
import { waitNodeExecutor } from "../../control/wait/executor";
import { mergeNodeExecutor } from "../../control/merge/executor";

export const executorsRegistry: Record<NodeType, NodeExecutor<any>> = {
    [NodeType.INITIAL]: () => Promise.resolve({}),
    [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor,
    [NodeType.CRON_TRIGGER]: cronTriggerExecutor,
    [NodeType.HTTP_REQUEST]: httpsRequestExecutor,
    [NodeType.X_POST]: xPostExecutor,
    [NodeType.LINKEDIN_POST]: linkedInPostExecutor,
    [NodeType.FACEBOOK_POST]: facebookPostExecutor,
    [NodeType.INSTAGRAM_POST]: instagramPostExecutor,
    [NodeType.THREADS_POST]: threadsPostExecutor,
    [NodeType.DISCORD_MESSAGE]: discordMessageExecutor,
    [NodeType.REDDIT_POST]: redditPostExecutor,
    [NodeType.BLUESKY_POST]: blueskyPostExecutor,
    [NodeType.MASTODON_POST]: mastodonPostExecutor,
    [NodeType.PINTEREST_PIN]: pinterestPinExecutor,
    [NodeType.AI_AGENT]: aiAgentExecutor,
    [NodeType.AI_GENERATE]: aiGenerateExecutor,
    [NodeType.AI_EXTRACT]: aiExtractExecutor,
    [NodeType.AI_CLASSIFY]: aiClassifyExecutor,
    [NodeType.AI_AGENT_EXP]: aiAgentExpExecutor,
    [NodeType.IF_CONDITION]: ifNodeExecutor,
    [NodeType.SWITCH]: switchNodeExecutor,
    [NodeType.LOOP]: loopNodeExecutor,
    [NodeType.WAIT]: waitNodeExecutor,
    [NodeType.MERGE]: mergeNodeExecutor,
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
