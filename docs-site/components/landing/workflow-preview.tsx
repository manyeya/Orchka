"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

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
        <section ref={containerRef} className="w-full py-32 bg-background overflow-hidden border-b border-border">
            <div className="container mx-auto px-4 md:px-6">
                <div className="preview-content flex flex-col items-center text-center">
                    <div className="inline-block px-3 py-1 mb-8 text-xs font-mono uppercase tracking-widest border border-primary text-primary">
                        Interface Preview
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase font-mono mb-12">
                        Visual Design System
                    </h2>

                    <div className="relative w-full max-w-6xl aspect-video bg-muted border border-border overflow-hidden group shadow-2xl">
                        {/* Mock UI */}
                        <div className="absolute inset-0 bg-background flex flex-col">
                            {/* Toolbar */}
                            <div className="h-10 border-b border-border bg-muted/50 flex items-center px-4 gap-4">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                                </div>
                                <div className="h-4 w-32 bg-border animate-pulse" />
                            </div>

                            {/* Dashboard Shell */}
                            <div className="flex-1 flex p-4 gap-4">
                                {/* Sidebar */}
                                <div className="w-48 border border-border flex flex-col p-2 gap-2">
                                    <div className="h-6 bg-muted animate-pulse" />
                                    <div className="h-6 bg-muted animate-pulse" />
                                    <div className="h-6 bg-muted animate-pulse" />
                                </div>

                                {/* Main Canvas Area */}
                                <div className="flex-1 border border-border relative overflow-hidden bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[20px_20px]">
                                    {/* Mock Nodes */}
                                    <div className="absolute top-[20%] left-[10%] w-40 h-24 border border-primary/50 bg-background p-2">
                                        <div className="h-full border border-dashed border-primary/30 flex items-center justify-center font-mono text-[10px] uppercase">Webhook_TR</div>
                                    </div>

                                    <div className="absolute top-[40%] left-[40%] w-48 h-32 border border-primary bg-background p-2 shadow-lg">
                                        <div className="h-full border border-dashed border-primary/30 flex items-center justify-center font-mono text-[10px] uppercase">AI_Agent_01</div>
                                    </div>

                                    <div className="absolute top-[30%] left-[75%] w-40 h-24 border border-primary/50 bg-background p-2">
                                        <div className="h-full border border-dashed border-primary/30 flex items-center justify-center font-mono text-[10px] uppercase">Slack_NT</div>
                                    </div>

                                    {/* Connections lines would go here */}
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
                                        <path d="M120 100 Q 220 100 240 180" stroke="var(--color-primary)" fill="none" strokeWidth="2" strokeDasharray="4 4" />
                                        <path d="M420 180 Q 480 180 500 130" stroke="var(--color-primary)" fill="none" strokeWidth="2" strokeDasharray="4 4" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
