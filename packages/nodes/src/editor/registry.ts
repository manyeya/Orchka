import type { ComponentType } from "react";
import type { NodeTypes } from "@xyflow/react";
import {
  Bot,
  BotMessageSquare,
  Clock,
  CloudSun,
  Facebook,
  FileJson,
  GitBranch,
  GitCompare,
  GitFork,
  GitMerge,
  GlobeIcon,
  Grid2X2,
  Linkedin,
  Instagram,
  MessageCircle,
  MessageCircleMore,
  MessageSquare,
  MousePointerIcon,
  Pin,
  RadioTower,
  Send,
  Sparkles,
  StickyNote,
  Tags,
} from "lucide-react";

import { NodeType, type NodeType as NodeTypeValue } from "../core/types";
import InitialNode from "../nodes/utils/initial-node";
import { ManualTriggerNode } from "../nodes/trigger/manual/manual-trigger-node";
import { CronTriggerNode } from "../nodes/trigger/cron/cron-trigger-node";
import { HttpRequestNode } from "../nodes/action/https-request/node";
import { XPostNode } from "../nodes/action/x-post/node";
import { LinkedInPostNode } from "../nodes/action/linkedin-post/node";
import { FacebookPostNode } from "../nodes/action/facebook-post/node";
import { InstagramPostNode } from "../nodes/action/instagram-post/node";
import { ThreadsPostNode } from "../nodes/action/threads-post/node";
import { DiscordMessageNode } from "../nodes/action/discord-message/node";
import { RedditPostNode } from "../nodes/action/reddit-post/node";
import { BlueskyPostNode } from "../nodes/action/bluesky-post/node";
import { MastodonPostNode } from "../nodes/action/mastodon-post/node";
import { PinterestPinNode } from "../nodes/action/pinterest-pin/node";
import { AIAgentNode } from "../nodes/ai/ai-agent/node";
import { AIGenerateNode } from "../nodes/ai/ai-generate/node";
import { AIExtractNode } from "../nodes/ai/ai-extract/node";
import { AIClassifyNode } from "../nodes/ai/ai-classify/node";
import { AIAgentExpNode } from "../nodes/ai/ai-agent-exp/node";
import { IfNode } from "../nodes/control/if/node";
import { SwitchNode } from "../nodes/control/switch/node";
import { LoopNode } from "../nodes/control/loop/node";
import { WaitNode } from "../nodes/control/wait/node";
import { MergeNode } from "../nodes/control/merge/node";
import GroupNode from "../nodes/tools/group-node";
import AnnotationNode from "../nodes/tools/annotation-node";

export const NODE_COMPONENTS = {
  [NodeType.INITIAL]: InitialNode,
  [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
  [NodeType.CRON_TRIGGER]: CronTriggerNode,
  [NodeType.HTTP_REQUEST]: HttpRequestNode,
  [NodeType.X_POST]: XPostNode,
  [NodeType.LINKEDIN_POST]: LinkedInPostNode,
  [NodeType.FACEBOOK_POST]: FacebookPostNode,
  [NodeType.INSTAGRAM_POST]: InstagramPostNode,
  [NodeType.THREADS_POST]: ThreadsPostNode,
  [NodeType.DISCORD_MESSAGE]: DiscordMessageNode,
  [NodeType.REDDIT_POST]: RedditPostNode,
  [NodeType.BLUESKY_POST]: BlueskyPostNode,
  [NodeType.MASTODON_POST]: MastodonPostNode,
  [NodeType.PINTEREST_PIN]: PinterestPinNode,
  [NodeType.AI_AGENT]: AIAgentNode,
  [NodeType.AI_GENERATE]: AIGenerateNode,
  [NodeType.AI_EXTRACT]: AIExtractNode,
  [NodeType.AI_CLASSIFY]: AIClassifyNode,
  [NodeType.AI_AGENT_EXP]: AIAgentExpNode,
  [NodeType.IF_CONDITION]: IfNode,
  [NodeType.SWITCH]: SwitchNode,
  [NodeType.LOOP]: LoopNode,
  [NodeType.WAIT]: WaitNode,
  [NodeType.MERGE]: MergeNode,
  [NodeType.GROUP]: GroupNode,
  [NodeType.ANNOTATION]: AnnotationNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof NODE_COMPONENTS;

export interface NodePaletteItem {
  type: NodeTypeValue;
  label: string;
  description?: string;
  icon: ComponentType<{ className?: string }> | string;
  tags?: string[];
}

export interface NodePaletteSection {
  id: string;
  label: string;
  items: NodePaletteItem[];
}

export const NODE_PALETTE_SECTIONS: NodePaletteSection[] = [
  {
    id: "triggers",
    label: "Triggers",
    items: [
      {
        type: NodeType.MANUAL_TRIGGER,
        label: "Manual Trigger",
        description: "Trigger a workflow manually",
        icon: MousePointerIcon,
        tags: ["trigger", "start"],
      },
      {
        type: NodeType.CRON_TRIGGER,
        label: "Cron Trigger",
        description: "Schedule workflow execution with cron",
        icon: Clock,
        tags: ["trigger", "schedule", "cron", "timer", "recurring"],
      },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    items: [
      {
        type: NodeType.HTTP_REQUEST,
        label: "HTTP Request",
        description: "Make an HTTP request",
        icon: GlobeIcon,
        tags: ["api", "fetch", "external"],
      },
      {
        type: NodeType.X_POST,
        label: "X Post",
        description: "Publish a post to X",
        icon: Send,
        tags: ["social", "twitter", "x", "post", "publish"],
      },
      {
        type: NodeType.LINKEDIN_POST,
        label: "LinkedIn Post",
        description: "Publish an organic LinkedIn post",
        icon: Linkedin,
        tags: ["social", "linkedin", "post", "publish"],
      },
      {
        type: NodeType.FACEBOOK_POST,
        label: "Facebook Page Post",
        description: "Publish to a Facebook Page",
        icon: Facebook,
        tags: ["social", "facebook", "page", "post", "publish"],
      },
      {
        type: NodeType.INSTAGRAM_POST,
        label: "Instagram Post",
        description: "Publish an Instagram image post",
        icon: Instagram,
        tags: ["social", "instagram", "post", "image", "publish"],
      },
      {
        type: NodeType.THREADS_POST,
        label: "Threads Post",
        description: "Publish a text post to Threads",
        icon: MessageCircle,
        tags: ["social", "threads", "post", "publish"],
      },
      {
        type: NodeType.DISCORD_MESSAGE,
        label: "Discord Message",
        description: "Send a Discord webhook message",
        icon: MessageSquare,
        tags: ["social", "discord", "message", "webhook"],
      },
      {
        type: NodeType.REDDIT_POST,
        label: "Reddit Post",
        description: "Submit to a subreddit",
        icon: MessageCircleMore,
        tags: ["social", "reddit", "post", "submit"],
      },
      {
        type: NodeType.BLUESKY_POST,
        label: "Bluesky Post",
        description: "Publish a text post to Bluesky",
        icon: CloudSun,
        tags: ["social", "bluesky", "post", "publish"],
      },
      {
        type: NodeType.MASTODON_POST,
        label: "Mastodon Post",
        description: "Publish a status to Mastodon",
        icon: RadioTower,
        tags: ["social", "mastodon", "fediverse", "post"],
      },
      {
        type: NodeType.PINTEREST_PIN,
        label: "Pinterest Pin",
        description: "Create a Pinterest pin",
        icon: Pin,
        tags: ["social", "pinterest", "pin", "image"],
      },
    ],
  },
  {
    id: "ai",
    label: "AI",
    items: [
      {
        type: NodeType.AI_GENERATE,
        label: "AI Generate",
        description: "Simple text generation",
        icon: Sparkles,
        tags: ["ai", "llm", "text", "generate"],
      },
      {
        type: NodeType.AI_EXTRACT,
        label: "AI Extract",
        description: "Structured data extraction",
        icon: FileJson,
        tags: ["ai", "llm", "extract", "json", "schema"],
      },
      {
        type: NodeType.AI_CLASSIFY,
        label: "AI Classify",
        description: "Classification and categorization",
        icon: Tags,
        tags: ["ai", "llm", "classify", "sentiment", "category"],
      },
      {
        type: NodeType.AI_AGENT_EXP,
        label: "AI Agent (SDK)",
        description: "Tool-using agent with AI SDK",
        icon: BotMessageSquare,
        tags: ["ai", "llm", "agent", "tools", "sdk"],
      },
      {
        type: NodeType.AI_AGENT,
        label: "AI Agent (Legacy)",
        description: "LLM-powered agent with LangChain",
        icon: Bot,
        tags: ["ai", "llm", "bot", "agent", "langchain"],
      },
    ],
  },
  {
    id: "control",
    label: "Flow Control",
    items: [
      {
        type: NodeType.IF_CONDITION,
        label: "If",
        description: "Branch based on a condition",
        icon: GitBranch,
        tags: ["logic", "branch"],
      },
      {
        type: NodeType.SWITCH,
        label: "Switch",
        description: "Route to multiple paths based on a value",
        icon: GitFork,
        tags: ["logic", "route"],
      },
      {
        type: NodeType.MERGE,
        label: "Merge",
        description: "Combine data from multiple branches",
        icon: GitMerge,
        tags: ["logic", "merge", "combine", "join"],
      },
      {
        type: NodeType.LOOP,
        label: "Loop",
        description: "Iterate over an array or count",
        icon: GitCompare,
        tags: ["iteration", "foreach"],
      },
      {
        type: NodeType.WAIT,
        label: "Wait",
        description: "Pause execution for a duration or until a time",
        icon: Clock,
        tags: ["delay", "timer"],
      },
    ],
  },
  {
    id: "tools",
    label: "Tools & Organization",
    items: [
      {
        type: NodeType.GROUP,
        label: "Group",
        description: "Group nodes together visually",
        icon: Grid2X2,
        tags: ["group", "organization", "container"],
      },
      {
        type: NodeType.ANNOTATION,
        label: "Note",
        description: "Add comments or instructions",
        icon: StickyNote,
        tags: ["note", "comment", "annotation", "text"],
      },
    ],
  },
];

export const NODE_PALETTE_ITEMS = NODE_PALETTE_SECTIONS.flatMap(
  (section) => section.items,
);
