"use client";

import Link from "next/link";
import { ArrowRight, Terminal, Cpu, Globe, Zap, Shield, Box, Activity } from "lucide-react";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { TextReveal } from "../ui/text-reveal";

export function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.set(".hero-badge", { y: -20, opacity: 0 });
        gsap.set(".hero-subtitle", { y: 20, opacity: 0 });
        gsap.set(".hero-desc", { y: 20, opacity: 0 });
        gsap.set(".hero-btn", { y: 20, opacity: 0 });
        gsap.set(".hero-stat", { y: 20, opacity: 0 });

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.to(".hero-badge", {
            y: 0,
            opacity: 1,
            duration: 0.8,
            delay: 0.2,
        })
            .to(".hero-subtitle", {
                y: 0,
                opacity: 1,
                duration: 0.8,
            }, "-=0.4")
            .to(".hero-desc", {
                y: 0,
                opacity: 1,
                duration: 0.8,
            }, "-=0.6")
            .to(".hero-btn", {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
            }, "-=0.6")
            .to(".hero-stat", {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
            }, "-=0.4");

    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background text-foreground border-b border-border py-20">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 hero-gradient pointer-events-none" />

            {/* Grid Background */}
            <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[6rem_6rem] mask-[radial-gradient(ellipse_50%_40%_at_50%_0%,#000_80%,transparent_100%)] opacity-30 pointer-events-none" />

            {/* Floating Abstract Elements */}
            <div className="absolute top-32 left-16 w-40 h-40 border border-primary/10" />
            <div className="absolute bottom-32 right-16 w-56 h-56 border border-primary/10" />

            <div className="container relative z-10 flex flex-col items-center text-center px-4 md:px-8 max-w-6xl">
                <div className="hero-badge inline-flex items-center gap-3 px-4 py-2 border border-border bg-background/80 backdrop-blur-sm mb-10">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span className="text-xs font-mono text-foreground uppercase tracking-widest font-medium">
                        Orchka v1.0.0
                    </span>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-bold tracking-tighter mb-4 uppercase font-mono leading-[0.9]">
                    <TextReveal text="Orchka" className="text-primary" />
                    <span className="hero-subtitle text-foreground block text-xl md:text-3xl lg:text-4xl mt-6 font-normal tracking-normal normal-case font-sans opacity-70">
                        Workflow Orchestration Reimagined
                    </span>
                </h1>

                <p className="hero-desc max-w-2xl leading-relaxed text-muted-foreground text-lg md:text-xl mb-12">
                    Build, deploy, and scale intelligent automations with Next.js 15, Inngest, and React Flow.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Link
                        href="/docs"
                        className="hero-btn inline-flex h-14 items-center justify-center border-2 border-primary bg-primary text-primary-foreground px-8 text-sm font-semibold transition-all hover:bg-primary/90 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 uppercase tracking-widest font-mono"
                    >
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link
                        href="https://github.com/manyeya/Orchka"
                        target="_blank"
                        className="hero-btn inline-flex h-14 items-center justify-center border-2 border-border bg-background text-foreground px-8 text-sm font-semibold transition-all hover:bg-accent hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 uppercase tracking-widest font-mono"
                    >
                        <Terminal className="mr-2 h-4 w-4" />
                        Source Code
                    </Link>
                </div>

                {/* Stats / Tech Deco */}
                <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8 w-full max-w-5xl border-t border-border pt-12">
                    <div className="hero-stat flex flex-col items-center gap-3">
                        <Cpu className="h-7 w-7 text-muted-foreground" />
                        <span className="text-2xl font-bold font-mono tracking-tight">Typesafe</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Prisma & tRPC</span>
                    </div>
                    <div className="hero-stat flex flex-col items-center gap-3">
                        <Globe className="h-7 w-7 text-muted-foreground" />
                        <span className="text-2xl font-bold font-mono tracking-tight">Reliable</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Inngest Engine</span>
                    </div>
                    <div className="hero-stat flex flex-col items-center gap-3">
                        <Zap className="h-7 w-7 text-muted-foreground" />
                        <span className="text-2xl font-bold font-mono tracking-tight">Visual</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">React Flow Core</span>
                    </div>
                    <div className="hero-stat flex flex-col items-center gap-3">
                        <Activity className="h-7 w-7 text-muted-foreground" />
                        <span className="text-2xl font-bold font-mono tracking-tight">AI Native</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">LangChain Support</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
