"use client";

import { Zap, Share2, Shield, Box, Cpu, Activity } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const features = [
    {
        title: "Node-Based Logic",
        description: "Construct complex logic flows using our visual node editor. Drag, drop, and connect to build your alien protocols.",
        icon: Share2,
    },
    {
        title: "Instant Execution",
        description: "Zero-latency execution engine powered by advanced edge computing. Your workflows run at light speed.",
        icon: Zap,
    },
    {
        title: "Secure Transmission",
        description: "End-to-end encryption for all data signals. Your intergalactic secrets are safe with us.",
        icon: Shield,
    },
    {
        title: "Modular Architecture",
        description: "Extensible plugin system. Add your own custom nodes or use our pre-built modules.",
        icon: Box,
    },
    {
        title: "AI Integration",
        description: "Native support for LLMs. Inject intelligence directly into your automation pipelines.",
        icon: Cpu,
    },
    {
        title: "Real-time Monitoring",
        description: "Watch your workflows execute in real-time. Debug and optimize with granular telemetry.",
        icon: Activity,
    },
];

import { useGSAP } from "@gsap/react";

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
                        System Capabilities
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase font-mono">
                        Core Modules
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
                                    MOD_{index.toString().padStart(2, "0")}
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
