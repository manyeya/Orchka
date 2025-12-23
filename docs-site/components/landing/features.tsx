"use client";

import { Zap, Share2, Shield, Box, Cpu, Activity, Database, GitBranch } from "lucide-react";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

const features = [
    {
        title: "Visual Workflow Editor",
        description: "Orchestrate complex logic flows using an intuitive drag-and-drop canvas powered by React Flow.",
        icon: Share2,
    },
    {
        title: "Durable Execution",
        description: "Reliable, persistent background jobs and long-running workflows managed by the Inngest engine.",
        icon: Zap,
    },
    {
        title: "AI Agent Native",
        description: "Deep integration with LangChain. Build autonomous agents that use tools and maintain memory.",
        icon: Cpu,
    },
    {
        title: "Typesafe Architecture",
        description: "End-to-end type safety from the database to the browser with Prisma and tRPC integration.",
        icon: GitBranch,
    },
    {
        title: "Expression Engine",
        description: "Powerful data transformation using JSONata expressions. Map and filter complex objects with ease.",
        icon: Database,
    },
    {
        title: "Real-time Telemetry",
        description: "Granular monitoring of every step. Watch executions, debug errors, and optimize flow performance.",
        icon: Activity,
    },
];

export function Features() {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.registerPlugin(ScrollTrigger);

        // Animate header
        gsap.set(".features-header", { y: 50, opacity: 0 });
        gsap.to(".features-header", {
            scrollTrigger: {
                trigger: ".features-header",
                start: "top 80%",
            },
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
        });

        // Animate cards
        gsap.set(".feature-card", { y: 50, opacity: 0 });
        gsap.to(".feature-card", {
            scrollTrigger: {
                trigger: ".features-grid",
                start: "top 80%",
            },
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
        });
    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="w-full py-20 bg-background border-b border-border">
            <div className="container mx-auto px-4 md:px-6">
                <div className="features-header flex flex-col items-start mb-12">
                    <div className="inline-block px-3 py-1 mb-4 text-xs font-mono uppercase tracking-widest border border-primary text-primary">
                        System Architecture
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase font-mono">
                        Core Capabilities
                    </h2>
                </div>

                <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-border">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="feature-card group relative p-8 border-r border-b border-border hover:bg-accent/5 transition-colors duration-300"
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-mono text-muted-foreground">
                                    M_{index.toString().padStart(2, "0")}
                                </span>
                            </div>

                            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-none border border-primary/20 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                <feature.icon className="h-5 w-5" />
                            </div>

                            <h3 className="text-xl font-bold mb-2 font-mono uppercase tracking-tight">
                                {feature.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
