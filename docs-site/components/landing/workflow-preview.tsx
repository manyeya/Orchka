"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { 
  ReactFlow, 
  Background, 
  MarkerType,
  Node,
  Edge,
  Position,
  Handle,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Webhook, Bot, MessageSquare, Database } from 'lucide-react';
import { cn } from "@/lib/utils";

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 50, y: 150 },
    data: { label: 'Webhook Trigger', icon: Webhook },
  },
  {
    id: '2',
    type: 'action',
    position: { x: 380, y: 230 },
    data: { label: 'AI Agent', icon: Bot, description: 'GPT-4 Turbo' },
  },
  {
    id: '3',
    type: 'action',
    position: { x: 700, y: 170 },
    data: { label: 'Slack Notification', icon: MessageSquare, description: '#workflow-channel' },
  },
  {
    id: '4',
    type: 'action',
    position: { x: 380, y: 370 },
    data: { label: 'Database', icon: Database, description: 'PostgreSQL' },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'step',
    animated: true,
    style: { stroke: 'var(--primary)', strokeWidth: 2 },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'step',
    animated: true,
    style: { stroke: 'var(--primary)', strokeWidth: 2 },
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    type: 'step',
    animated: true,
    style: { stroke: 'var(--primary)', strokeWidth: 2 },
  },
];

function TriggerNode({ data }: { data: any }) {
  const Icon = data.icon;
  
  return (
    <div className="bg-card border-accent text-card-foreground relative border rounded-l-2xl hover:border-primary group cursor-default">
      <div className="p-3 flex flex-col gap-2">
        <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <Handle
        id="target"
        type="source"
        position={Position.Right}
        className="bg-primary! border-primary! h-[11px] w-[11px] rounded-none! border"
      />
    </div>
  );
}

function ActionNode({ data }: { data: any }) {
  const Icon = data.icon;
  
  return (
    <div className="bg-card border-accent text-card-foreground relative border hover:border-primary group cursor-default">
      <div className="p-3 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-xs font-mono uppercase tracking-tight font-semibold">
            {data.label}
          </span>
        </div>
        {data.description && (
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
            {data.description}
          </p>
        )}
      </div>
      <Handle
        id="target"
        type="target"
        position={Position.Left}
        className="bg-primary! border-primary! h-[11px] w-[11px] rounded-none! border"
      />
      <Handle
        id="source"
        type="source"
        position={Position.Right}
        className="bg-primary! border-primary! h-[11px] w-[11px] rounded-none! border"
      />
    </div>
  );
}

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
};

export function WorkflowPreview() {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.registerPlugin(ScrollTrigger);

        gsap.set(".preview-content", { y: 100, opacity: 0 });
        gsap.to(".preview-content", {
            scrollTrigger: {
                trigger: ".preview-content",
                start: "top 80%",
            },
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power4.out",
        });
    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="w-full py-24 md:py-32 bg-background overflow-hidden border-b border-border">
            <div className="container mx-auto px-4 md:px-8 max-w-6xl">
                <div className="preview-content flex flex-col items-center text-center">
                    <div className="inline-block px-4 py-2 mb-8 text-xs font-mono uppercase tracking-widest border border-primary text-primary font-medium">
                        Interface Preview
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight uppercase font-mono mb-6">
                        Visual Design System
                    </h2>
                    <p className="text-muted-foreground mb-12 max-w-xl">
                        Build complex workflows with an intuitive drag-and-drop canvas powered by React Flow
                    </p>

                    <div className="relative w-full max-w-5xl h-[500px] bg-background border-2 border-border overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-size-[20px_20px]" />
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-background border border-border">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 bg-foreground/30" />
                                <div className="w-2.5 h-2.5 bg-foreground/30" />
                                <div className="w-2.5 h-2.5 bg-foreground/30" />
                            </div>
                            <div className="h-3.5 w-32 bg-border animate-pulse" />
                        </div>
                        
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
                                style: { stroke: 'var(--primary)' },
                                type: 'step',
                            }}
                            connectionLineStyle={{ stroke: 'var(--primary)', strokeWidth: 2 }}
                            connectionLineType={ConnectionLineType.Step}
                            snapToGrid
                            snapGrid={[20, 20]}
                            className="!bg-transparent"
                        >
                            <Background gap={20} />
                        </ReactFlow>
                    </div>
                </div>
            </div>
        </section>
    );
}
