"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ReactFlow,
  Background,
  Node,
  Edge,
  Position,
  Handle,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Webhook, Bot, MessageSquare, Database, ArrowRight } from "lucide-react";

const initialNodes: Node[] = [
  {
    id: "1",
    type: "trigger",
    position: { x: 50, y: 150 },
    data: { label: "Webhook", icon: Webhook, status: "active" },
  },
  {
    id: "2",
    type: "ai",
    position: { x: 350, y: 230 },
    data: { label: "AI Agent", icon: Bot, status: "active" },
  },
  {
    id: "3",
    type: "action",
    position: { x: 650, y: 170 },
    data: { label: "Slack", icon: MessageSquare, status: "pending" },
  },
  {
    id: "4",
    type: "action",
    position: { x: 650, y: 310 },
    data: { label: "Database", icon: Database, status: "pending" },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
    style: { stroke: "var(--primary)", strokeWidth: 2 },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    animated: true,
    style: { stroke: "var(--primary)", strokeWidth: 2 },
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
    animated: true,
    style: { stroke: "var(--primary)", strokeWidth: 2 },
  },
];

function TriggerNode({ data }: { data: any }) {
  const Icon = data.icon;
  return (
    <div className="relative bg-[var(--background)] border-2 border-[var(--primary)] text-[var(--foreground)] px-4 py-3 min-w-[140px]">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[var(--primary)]/10">
          <Icon className="w-4 h-4 text-[var(--primary)]" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider font-semibold">
            {data.label}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)]">Trigger</p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-[var(--primary)] border-2 border-[var(--background)]"
      />
    </div>
  );
}

function AINode({ data }: { data: any }) {
  const Icon = data.icon;
  return (
    <div className="relative bg-[var(--background)] border-2 border-[var(--primary)] text-[var(--foreground)] px-4 py-3 min-w-[140px]">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[var(--primary)]/10">
          <Icon className="w-4 h-4 text-[var(--primary)]" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider font-semibold">
            {data.label}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)]">GPT-4</p>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-[var(--primary)] border-2 border-[var(--background)]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-[var(--primary)] border-2 border-[var(--background)]"
      />
    </div>
  );
}

function ActionNode({ data }: { data: any }) {
  const Icon = data.icon;
  return (
    <div className="relative bg-[var(--background)] border-2 border-[var(--border)] text-[var(--foreground)] px-4 py-3 min-w-[140px]">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[var(--muted)]">
          <Icon className="w-4 h-4 text-[var(--muted-foreground)]" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider font-semibold">
            {data.label}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)]">Action</p>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-[var(--border)] border-2 border-[var(--background)]"
      />
    </div>
  );
}

const nodeTypes = {
  trigger: TriggerNode,
  ai: AINode,
  action: ActionNode,
};

export function WorkflowShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Header animation
    gsap.from(".showcase-header", {
      y: 60,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".showcase-header",
        start: "top 85%",
      },
    });

    // Code block animation
    gsap.from(".code-block", {
      x: -100,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".code-block",
        start: "top 80%",
      },
    });

    // Flow preview animation
    gsap.from(".flow-preview", {
      x: 100,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".flow-preview",
        start: "top 80%",
      },
    });
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative w-full py-32 bg-[var(--accent)] overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[60px_60px]" />
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        {/* Header */}
        <div className="showcase-header text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-mono uppercase tracking-[0.2em] border border-[var(--primary)] text-[var(--primary)]">
            <span>Live Demo</span>
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter uppercase font-mono leading-[0.95]">
            Build workflows
            <br />
            <span className="text-[var(--primary)]">visually</span>
          </h2>
        </div>

        {/* Split layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Code block */}
          <div className="code-block relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[var(--primary)]/20 to-transparent blur-2xl" />
            <div className="relative bg-[var(--background)] border border-[var(--border)] overflow-hidden">
              {/* Window controls */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-4 text-xs font-mono text-[var(--muted-foreground)]">
                  executor.ts
                </span>
              </div>
              {/* Code content */}
              <div className="p-6 text-sm font-mono overflow-x-auto bg-[var(--accent)]">
                <pre className="text-[var(--foreground)]">{`export const aiAgentExecutor: NodeExecutor = {
  // Initialize AI agent
  const agent = new Agent({
    model: "gpt-4-turbo",
    tools: ["slack", "database"],
  });

  const result = await agent.run(input);

  return { result };
}`}</pre>
              </div>
            </div>
          </div>

          {/* Flow preview */}
          <div className="flow-preview relative">
            <div className="absolute -inset-4 bg-gradient-to-l from-[var(--primary)]/20 to-transparent blur-2xl" />
            <div className="relative bg-[var(--background)] border-2 border-[var(--border)] overflow-hidden h-[400px]">
              {/* Grid background */}
              <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-size-[20px_20px] opacity-50" />

              <ReactFlow
                nodes={initialNodes}
                edges={initialEdges}
                nodeTypes={nodeTypes}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnScroll={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{
                  animated: true,
                  style: { stroke: "var(--primary)", strokeWidth: 2 },
                }}
                className="!bg-transparent"
              >
                <Background gap={20} size={1} />
              </ReactFlow>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <a
            href="/docs"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-[var(--primary)] hover:gap-4 transition-all"
          >
            Explore all node types
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
