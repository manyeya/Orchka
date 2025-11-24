"use client";

import { useCallback } from "react";
import {
    ReactFlow,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    MarkerType,
    Position,
    Handle,
    NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Database, Mail, MessageSquare, FileText, Globe, Zap, LucideIcon, Lock, Activity, Cpu } from "lucide-react";

// Icon map for serializable data
const iconMap = {
    Globe,
    FileText,
    Zap,
    Database,
    Mail,
    MessageSquare,
} as const;

// Custom Node Component
const BrutalistNode = (props: NodeProps) => {
    const data = props.data as { label: string; icon: keyof typeof iconMap };
    const Icon = iconMap[data.icon];
    return (
        <div className="relative min-w-[150px] bg-background border border-border p-3 shadow-sm group hover:border-primary transition-colors">
            {/* Decorators */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-accent/10 border border-accent/20 text-accent">
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Node</span>
                    <span className="text-sm font-bold font-mono uppercase">{data.label}</span>
                </div>
            </div>

            <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2 !rounded-none !border-none" />
            <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2 !rounded-none !border-none" />
        </div>
    );
};

const nodeTypes = {
    brutalist: BrutalistNode,
};

const initialNodes = [
    {
        id: "1",
        type: "brutalist",
        position: { x: 250, y: 0 },
        data: { label: "Webhook", icon: "Globe" },
    },
    {
        id: "2",
        type: "brutalist",
        position: { x: 100, y: 100 },
        data: { label: "Parse JSON", icon: "FileText" },
    },
    {
        id: "3",
        type: "brutalist",
        position: { x: 400, y: 100 },
        data: { label: "AI Analysis", icon: "Zap" },
    },
    {
        id: "4",
        type: "brutalist",
        position: { x: 100, y: 200 },
        data: { label: "Update DB", icon: "Database" },
    },
    {
        id: "5",
        type: "brutalist",
        position: { x: 400, y: 200 },
        data: { label: "Send Email", icon: "Mail" },
    },
    {
        id: "6",
        type: "brutalist",
        position: { x: 250, y: 300 },
        data: { label: "Slack Notify", icon: "MessageSquare" },
    },
];

const initialEdges = [
    { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "var(--primary)" } },
    { id: "e1-3", source: "1", target: "3", animated: true, style: { stroke: "var(--primary)" } },
    { id: "e2-4", source: "2", target: "4", animated: true, style: { stroke: "var(--primary)" } },
    { id: "e3-5", source: "3", target: "5", animated: true, style: { stroke: "var(--primary)" } },
    { id: "e4-6", source: "4", target: "6", animated: true, style: { stroke: "var(--primary)" } },
    { id: "e5-6", source: "5", target: "6", animated: true, style: { stroke: "var(--primary)" } },
];

export function WorkflowPreview() {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "var(--primary)" } }, eds)),
        [setEdges],
    );

    return (
        <section className="w-full py-20 bg-background border-b border-border overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase font-mono mb-4">
                        Visual Intelligence
                    </h2>
                    <p className="text-muted-foreground max-w-2xl font-mono">
                        Orchestrate complex logic with a drag-and-drop interface designed for superior lifeforms.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[800px] md:h-[600px]">
                    {/* Main Visualizer - Spans 2 cols */}
                    <div className="md:col-span-2 relative bg-accent/5 border border-border rounded-lg overflow-hidden group">
                        <div className="absolute top-4 left-4 z-10 px-2 py-1 bg-background border border-border text-xs font-mono uppercase">
                            Live Preview
                        </div>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            nodeTypes={nodeTypes}
                            fitView
                            className="bg-background/50"
                            minZoom={0.5}
                            maxZoom={1.5}
                            defaultEdgeOptions={{
                                type: 'smoothstep',
                                markerEnd: {
                                    type: MarkerType.ArrowClosed,
                                    color: 'var(--primary)',
                                },
                            }}
                            proOptions={{ hideAttribution: true }}
                        >
                            <Background color="var(--border)" gap={20} size={1} />
                        </ReactFlow>
                    </div>

                    {/* Bento Grid Explainers - Right Col */}
                    <div className="grid grid-rows-3 gap-4">
                        {/* Card 1 */}
                        <div className="p-6 bg-background border border-border flex flex-col justify-center hover:bg-accent/5 transition-colors">
                            <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
                                <Cpu className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold font-mono uppercase mb-2">AI Native</h3>
                            <p className="text-sm text-muted-foreground">
                                Built-in LLM nodes allow you to inject intelligence at any step of your workflow.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="p-6 bg-background border border-border flex flex-col justify-center hover:bg-accent/5 transition-colors">
                            <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold font-mono uppercase mb-2">Real-time Sync</h3>
                            <p className="text-sm text-muted-foreground">
                                Watch execution logs stream in real-time with sub-millisecond latency.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="p-6 bg-background border border-border flex flex-col justify-center hover:bg-accent/5 transition-colors">
                            <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
                                <Lock className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold font-mono uppercase mb-2">Enterprise Secure</h3>
                            <p className="text-sm text-muted-foreground">
                                SOC2 compliant infrastructure with end-to-end encryption for all data payloads.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
