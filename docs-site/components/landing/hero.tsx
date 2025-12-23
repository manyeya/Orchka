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
        <section ref={containerRef} className="relative min-h-[90vh] w-full flex flex-col items-center justify-center overflow-hidden bg-background text-foreground border-b border-border py-12">
            {/* Grid Background */}
            <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

            {/* Floating Abstract Elements */}
            <div className="absolute top-20 left-10 w-32 h-32 border border-primary/20 rounded-full animate-pulse opacity-50 hidden md:block" />
            <div className="absolute bottom-20 right-10 w-48 h-48 border border-primary/20 rounded-full animate-pulse [animation-delay:700ms] opacity-50 hidden md:block" />

            <div className="container relative z-10 flex flex-col items-center text-center px-4 md:px-6">
                <div className="hero-badge inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/50 backdrop-blur-sm mb-8">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                        Orchka v1.0.0 Online
                    </span>
                </div>

                <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tighter mb-6 uppercase font-mono">
                    <TextReveal text="Orchka" className="text-primary" />
                    <span className="hero-subtitle text-primary block text-2xl md:text-4xl lg:text-5xl mt-2 font-normal tracking-normal normal-case font-sans opacity-80">
                        Workflow Orchestration Reimagined
                    </span>
                </h1>

                <p className="hero-desc max-w-3xl leading-normal text-muted-foreground sm:text-xl sm:leading-8 mb-10 font-mono">
                    The brutalist workflow engine for modern engineering teams. Build, deploy, and scale intelligent automations with Next.js 15, Inngest, and React Flow.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link
                        href="/docs"
                        className="hero-btn inline-flex h-12 items-center justify-center rounded-none border border-primary bg-primary text-primary-foreground px-8 text-sm font-medium shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 uppercase tracking-widest font-mono"
                    >
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link
                        href="https://github.com/manyeya/Orchka"
                        target="_blank"
                        className="hero-btn inline-flex h-12 items-center justify-center rounded-none border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 uppercase tracking-widest font-mono"
                    >
                        <Terminal className="mr-2 h-4 w-4" />
                        Source Code
                    </Link>
                </div>

                {/* Stats / Tech Deco */}
                <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl border-t border-border pt-8">
                    <div className="hero-stat flex flex-col items-center gap-2">
                        <Cpu className="h-6 w-6 text-muted-foreground" />
                        <span className="text-2xl font-bold font-mono">Typesafe</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Prisma & tRPC</span>
                    </div>
                    <div className="hero-stat flex flex-col items-center gap-2">
                        <Globe className="h-6 w-6 text-muted-foreground" />
                        <span className="text-2xl font-bold font-mono">Reliable</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Inngest Engine</span>
                    </div>
                    <div className="hero-stat flex flex-col items-center gap-2">
                        <Zap className="h-6 w-6 text-muted-foreground" />
                        <span className="text-2xl font-bold font-mono">Visual</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">React Flow Core</span>
                    </div>
                    <div className="hero-stat flex flex-col items-center gap-2">
                        <Activity className="h-6 w-6 text-muted-foreground" />
                        <span className="text-2xl font-bold font-mono">AI Native</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">LangChain Support</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
