import { NodeType } from "./types";

/**
 * Registry of required fields per node type.
 * Add new node types here with their required field names.
 * All nodes require a 'name' field by default.
 */
export const NODE_REQUIRED_FIELDS: Record<string, string[]> = {
    [NodeType.INITIAL]: [],
    [NodeType.MANUAL_TRIGGER]: ['name'],
    [NodeType.CRON_TRIGGER]: ['name', 'cronPattern'],
    [NodeType.HTTP_REQUEST]: ['name', 'url'],
    [NodeType.X_POST]: ['name', 'text'],
    [NodeType.LINKEDIN_POST]: ['name', 'authorUrn', 'commentary'],
    [NodeType.FACEBOOK_POST]: ['name', 'pageId', 'text'],
    [NodeType.INSTAGRAM_POST]: ['name', 'instagramUserId', 'imageUrl'],
    [NodeType.THREADS_POST]: ['name', 'text'],
    [NodeType.DISCORD_MESSAGE]: ['name', 'content'],
    [NodeType.REDDIT_POST]: ['name', 'subreddit', 'title'],
    [NodeType.BLUESKY_POST]: ['name', 'text'],
    [NodeType.MASTODON_POST]: ['name', 'text'],
    [NodeType.PINTEREST_PIN]: ['name', 'boardId', 'imageUrl'],
    [NodeType.AI_AGENT]: ['name', 'model'],
    [NodeType.AI_GENERATE]: ['name', 'model'],
    [NodeType.AI_EXTRACT]: ['name', 'model'],
    [NodeType.AI_CLASSIFY]: ['name', 'model'],
    [NodeType.AI_AGENT_EXP]: ['name', 'model'],
    [NodeType.IF_CONDITION]: ['name', 'condition'],
    [NodeType.SWITCH]: ['name', 'expression'],
    [NodeType.LOOP]: ['name', 'mode'],
    [NodeType.WAIT]: ['name', 'mode'],
    [NodeType.GROUP]: [],
    [NodeType.MERGE]: [],
    [NodeType.ANNOTATION]: [],
};

export const DEFAULT_REQUIRED_FIELDS = ['name'];
