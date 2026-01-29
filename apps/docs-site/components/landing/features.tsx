"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  Share2,
  Zap,
  Cpu,
  GitBranch,
  Activity,

  Braces,
  Sparkles,
} from "lucide-react";

const features = [
  {
    title: "Visual Workflow Builder",
    description: "Drag, drop, and connect nodes to build complex automations. Real-time validation and intuitive canvas powered by React Flow.",
    icon: Share2,
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "AI-Native Architecture",
    description: "Build autonomous agents with LangChain integration. Chain multiple AI calls, maintain memory, and use tools seamlessly.",
    icon: Cpu,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Durable Execution",
    description: "BullMQ-powered job queues ensure your workflows never lose state. Handle retries, delays, and long-running processes with ease.",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Expression Engine",
    description: "Transform and map data between nodes using JSONata expressions. Access outputs, workflow metadata, and environment variables.",
    icon: Braces,
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "End-to-End Type Safety",
    description: "From database to browser, Prisma and tRPC ensure your workflows are type-safe. Catch errors at compile time, not runtime.",
    icon: GitBranch,
    color: "from-red-500 to-rose-500",
  },
  {
    title: "Real-time Telemetry",
    description: "Watch every step execute in real-time. Debug errors, inspect outputs, and optimize performance with live execution monitoring.",
    icon: Activity,
    color: "from-yellow-500 to-amber-500",
  },
];

export function Features() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Header animation
    gsap.from(".features-header", {
      y: 80,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".features-header",
        start: "top 85%",
      },
    });

    // Feature cards stagger animation
    gsap.from(".feature-card", {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".features-grid",
        start: "top 80%",
      },
    });

    // Card hover effects
    const cards = containerRef.current?.querySelectorAll(".feature-card");
    cards?.forEach((card) => {
      const icon = card.querySelector(".feature-icon");
      const border = card.querySelector(".feature-border");

      card.addEventListener("mouseenter", () => {
        gsap.to(icon, {
          scale: 1.1,
          rotate: 5,
          duration: 0.3,
          ease: "back.out(1.7)",
        });
        gsap.to(border, {
          scaleX: 1,
          duration: 0.4,
          ease: "power2.out",
        });
      });

      card.addEventListener("mouseleave", () => {
        gsap.to(icon, {
          scale: 1,
          rotate: 0,
          duration: 0.3,
        });
        gsap.to(border, {
          scaleX: 0,
          duration: 0.4,
        });
      });
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative w-full py-32 bg-[var(--background)] overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--primary)]/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        {/* Header */}
        <div className="features-header flex flex-col items-start mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-mono uppercase tracking-[0.2em] border border-[var(--primary)] text-[var(--primary)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Core Features</span>
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter uppercase font-mono leading-[0.95]">
            Everything you need
            <br />
            <span className="text-[var(--primary)]">to build automations</span>
          </h2>
        </div>

        {/* Features Grid */}
        <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border)]">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card relative bg-[var(--background)] p-8 md:p-10 group cursor-pointer interactive overflow-hidden"
            >
              {/* Animated border */}
              <div className="feature-border absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent scale-x-0 origin-left" />

              {/* Icon */}
              <div className="feature-icon mb-6 inline-flex p-4 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-[var(--primary)]/20">
                <feature.icon className="w-6 h-6 text-[var(--primary)]" />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-3 font-mono uppercase tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-[var(--muted-foreground)] leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>

              {/* Number decoration */}
              <span className="absolute top-6 right-6 text-[10px] font-mono text-[var(--muted-foreground)]/40 uppercase tracking-wider">
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
