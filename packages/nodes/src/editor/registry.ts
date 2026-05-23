import type { ComponentType } from "react";
import type { NodeTypes } from "@xyflow/react";
import {
  Bot,
  BotMessageSquare,
  Boxes,
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
  Wrench,
  Zap,
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

export type NodePaletteIcon =
  | ComponentType<{ className?: string }>
  | string;

export interface NodePaletteLeaf {
  kind: "node";
  type: NodeTypeValue;
  label: string;
  description?: string;
  icon: NodePaletteIcon;
  tags?: string[];
}

export interface NodePaletteFolder {
  kind: "folder";
  id: string;
  label: string;
  description?: string;
  icon: NodePaletteIcon;
  children: NodePaletteEntry[];
}

export type NodePaletteEntry = NodePaletteLeaf | NodePaletteFolder;

/** @deprecated use NodePaletteLeaf */
export type NodePaletteItem = NodePaletteLeaf;

const leaf = (item: Omit<NodePaletteLeaf, "kind">): NodePaletteLeaf => ({
  kind: "node",
  ...item,
});

const folder = (item: Omit<NodePaletteFolder, "kind">): NodePaletteFolder => ({
  kind: "folder",
  ...item,
});

export const NODE_PALETTE_ROOT: NodePaletteEntry[] = [
  folder({
    id: "triggers",
    label: "Triggers",
    description: "Start a workflow",
    icon: Zap,
    children: [
      leaf({
        type: NodeType.MANUAL_TRIGGER,
        label: "Manual Trigger",
        description: "Trigger a workflow manually",
        icon: MousePointerIcon,
        tags: ["trigger", "start"],
      }),
      leaf({
        type: NodeType.CRON_TRIGGER,
        label: "Cron Trigger",
        description: "Schedule workflow execution with cron",
        icon: Clock,
        tags: ["trigger", "schedule", "cron", "timer", "recurring"],
      }),
    ],
  }),
  folder({
    id: "actions",
    label: "Actions",
    description: "Talk to apps and APIs",
    icon: Boxes,
    children: [
      leaf({
        type: NodeType.HTTP_REQUEST,
        label: "HTTP Request",
        description: "Make an HTTP request",
        icon: GlobeIcon,
        tags: ["api", "fetch", "external", "http"],
      }),
      folder({
        id: "actions/x",
        label: "X",
        description: "Post to X (formerly Twitter)",
        icon: Send,
        children: [
          leaf({
            type: NodeType.X_POST,
            label: "X Post",
            description: "Publish a post to X",
            icon: Send,
            tags: ["social", "twitter", "x", "post", "publish"],
          }),
        ],
      }),
      folder({
        id: "actions/linkedin",
        label: "LinkedIn",
        description: "Publish to LinkedIn",
        icon: Linkedin,
        children: [
          leaf({
            type: NodeType.LINKEDIN_POST,
            label: "LinkedIn Post",
            description: "Publish an organic LinkedIn post",
            icon: Linkedin,
            tags: ["social", "linkedin", "post", "publish"],
          }),
        ],
      }),
      folder({
        id: "actions/facebook",
        label: "Facebook",
        description: "Publish to Facebook Pages",
        icon: Facebook,
        children: [
          leaf({
            type: NodeType.FACEBOOK_POST,
            label: "Facebook Page Post",
            description: "Publish to a Facebook Page",
            icon: Facebook,
            tags: ["social", "facebook", "page", "post", "publish"],
          }),
        ],
      }),
      folder({
        id: "actions/instagram",
        label: "Instagram",
        description: "Publish to Instagram",
        icon: Instagram,
        children: [
          leaf({
            type: NodeType.INSTAGRAM_POST,
            label: "Instagram Post",
            description: "Publish an Instagram image post",
            icon: Instagram,
            tags: ["social", "instagram", "post", "image", "publish"],
          }),
        ],
      }),
      folder({
        id: "actions/threads",
        label: "Threads",
        description: "Publish to Threads",
        icon: MessageCircle,
        children: [
          leaf({
            type: NodeType.THREADS_POST,
            label: "Threads Post",
            description: "Publish a text post to Threads",
            icon: MessageCircle,
            tags: ["social", "threads", "post", "publish"],
          }),
        ],
      }),
      folder({
        id: "actions/discord",
        label: "Discord",
        description: "Send messages to Discord",
        icon: MessageSquare,
        children: [
          leaf({
            type: NodeType.DISCORD_MESSAGE,
            label: "Discord Message",
            description: "Send a Discord webhook message",
            icon: MessageSquare,
            tags: ["social", "discord", "message", "webhook"],
          }),
        ],
      }),
      folder({
        id: "actions/reddit",
        label: "Reddit",
        description: "Submit to Reddit",
        icon: MessageCircleMore,
        children: [
          leaf({
            type: NodeType.REDDIT_POST,
            label: "Reddit Post",
            description: "Submit to a subreddit",
            icon: MessageCircleMore,
            tags: ["social", "reddit", "post", "submit"],
          }),
        ],
      }),
      folder({
        id: "actions/bluesky",
        label: "Bluesky",
        description: "Publish to Bluesky",
        icon: CloudSun,
        children: [
          leaf({
            type: NodeType.BLUESKY_POST,
            label: "Bluesky Post",
            description: "Publish a text post to Bluesky",
            icon: CloudSun,
            tags: ["social", "bluesky", "post", "publish"],
          }),
        ],
      }),
      folder({
        id: "actions/mastodon",
        label: "Mastodon",
        description: "Publish to Mastodon",
        icon: RadioTower,
        children: [
          leaf({
            type: NodeType.MASTODON_POST,
            label: "Mastodon Post",
            description: "Publish a status to Mastodon",
            icon: RadioTower,
            tags: ["social", "mastodon", "fediverse", "post"],
          }),
        ],
      }),
      folder({
        id: "actions/pinterest",
        label: "Pinterest",
        description: "Pin to Pinterest",
        icon: Pin,
        children: [
          leaf({
            type: NodeType.PINTEREST_PIN,
            label: "Pinterest Pin",
            description: "Create a Pinterest pin",
            icon: Pin,
            tags: ["social", "pinterest", "pin", "image"],
          }),
        ],
      }),
    ],
  }),
  folder({
    id: "ai",
    label: "AI",
    description: "LLM and agent nodes",
    icon: Sparkles,
    children: [
      leaf({
        type: NodeType.AI_GENERATE,
        label: "AI Generate",
        description: "Simple text generation",
        icon: Sparkles,
        tags: ["ai", "llm", "text", "generate"],
      }),
      leaf({
        type: NodeType.AI_EXTRACT,
        label: "AI Extract",
        description: "Structured data extraction",
        icon: FileJson,
        tags: ["ai", "llm", "extract", "json", "schema"],
      }),
      leaf({
        type: NodeType.AI_CLASSIFY,
        label: "AI Classify",
        description: "Classification and categorization",
        icon: Tags,
        tags: ["ai", "llm", "classify", "sentiment", "category"],
      }),
      leaf({
        type: NodeType.AI_AGENT_EXP,
        label: "AI Agent (SDK)",
        description: "Tool-using agent with AI SDK",
        icon: BotMessageSquare,
        tags: ["ai", "llm", "agent", "tools", "sdk"],
      }),
      leaf({
        type: NodeType.AI_AGENT,
        label: "AI Agent (Legacy)",
        description: "LLM-powered agent with LangChain",
        icon: Bot,
        tags: ["ai", "llm", "bot", "agent", "langchain"],
      }),
    ],
  }),
  folder({
    id: "control",
    label: "Flow Control",
    description: "Branch, loop, merge, wait",
    icon: GitBranch,
    children: [
      leaf({
        type: NodeType.IF_CONDITION,
        label: "If",
        description: "Branch based on a condition",
        icon: GitBranch,
        tags: ["logic", "branch"],
      }),
      leaf({
        type: NodeType.SWITCH,
        label: "Switch",
        description: "Route to multiple paths based on a value",
        icon: GitFork,
        tags: ["logic", "route"],
      }),
      leaf({
        type: NodeType.MERGE,
        label: "Merge",
        description: "Combine data from multiple branches",
        icon: GitMerge,
        tags: ["logic", "merge", "combine", "join"],
      }),
      leaf({
        type: NodeType.LOOP,
        label: "Loop",
        description: "Iterate over an array or count",
        icon: GitCompare,
        tags: ["iteration", "foreach"],
      }),
      leaf({
        type: NodeType.WAIT,
        label: "Wait",
        description: "Pause execution for a duration or until a time",
        icon: Clock,
        tags: ["delay", "timer"],
      }),
    ],
  }),
  folder({
    id: "tools",
    label: "Tools & Organization",
    description: "Visual helpers for the canvas",
    icon: Wrench,
    children: [
      leaf({
        type: NodeType.GROUP,
        label: "Group",
        description: "Group nodes together visually",
        icon: Grid2X2,
        tags: ["group", "organization", "container"],
      }),
      leaf({
        type: NodeType.ANNOTATION,
        label: "Note",
        description: "Add comments or instructions",
        icon: StickyNote,
        tags: ["note", "comment", "annotation", "text"],
      }),
    ],
  }),
];

export function flattenLeaves(entries: NodePaletteEntry[]): NodePaletteLeaf[] {
  const out: NodePaletteLeaf[] = [];
  for (const entry of entries) {
    if (entry.kind === "node") {
      out.push(entry);
    } else {
      out.push(...flattenLeaves(entry.children));
    }
  }
  return out;
}

export function findFolder(
  entries: NodePaletteEntry[],
  path: string[],
): NodePaletteFolder | null {
  let current: NodePaletteEntry[] = entries;
  let folderRef: NodePaletteFolder | null = null;
  for (const id of path) {
    const next = current.find(
      (e): e is NodePaletteFolder => e.kind === "folder" && e.id === id,
    );
    if (!next) return null;
    folderRef = next;
    current = next.children;
  }
  return folderRef;
}

export const NODE_PALETTE_ITEMS: NodePaletteLeaf[] =
  flattenLeaves(NODE_PALETTE_ROOT);
