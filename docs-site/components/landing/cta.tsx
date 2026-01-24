"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, Github, Star } from "lucide-react";
import { MagneticButton } from "../ui/magnetic-button";

export function CTA() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const content = containerRef.current?.querySelector(".cta-content");
    const stats = containerRef.current?.querySelectorAll(".stat-item");

    if (content) {
      gsap.from(content, {
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: content,
          start: "top 85%",
        },
      });
    }

    if (stats) {
      gsap.from(stats, {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: stats[0],
          start: "top 85%",
        },
      });
    }
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative w-full py-32 overflow-hidden border-t border-[var(--border)]"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[var(--background)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--primary)] rounded-full blur-[300px] opacity-10 animate-pulse" />
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        {/* Main CTA content */}
        <div className="cta-content text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-xs font-mono uppercase tracking-[0.2em] border border-[var(--primary)] text-[var(--primary)]">
            <span>Get Started</span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter uppercase font-mono leading-[0.95] mb-8">
            Ready to build
            <br />
            <span className="text-[var(--primary)]">something amazing?</span>
          </h2>

          <p className="text-[var(--muted-foreground)] text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
            Join thousands of developers automating their workflows with Orchka.
            <br />
            Open source, extensible, and built for the modern web.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MagneticButton href="/docs" variant="primary" className="interactive text-black!">
              Read the docs
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>
            <MagneticButton
              href="https://github.com/manyeya/Orchka"
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              className="interactive"
            >
              <Github className="w-4 h-4" />
              Star on GitHub
            </MagneticButton>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 pt-16 border-t border-[var(--border)]">
          <div className="stat-item text-center">
            <div className="text-4xl md:text-5xl font-bold font-mono text-[var(--primary)] mb-2">
              15+
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
              Node Types
            </div>
          </div>
          <div className="stat-item text-center">
            <div className="text-4xl md:text-5xl font-bold font-mono text-[var(--primary)] mb-2">
              100%
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
              Open Source
            </div>
          </div>
          <div className="stat-item text-center">
            <div className="text-4xl md:text-5xl font-bold font-mono text-[var(--primary)] mb-2">
              TS
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
              Type Safe
            </div>
          </div>
          <div className="stat-item text-center">
            <div className="text-4xl md:text-5xl font-bold font-mono text-[var(--primary)] mb-2">
              ∞
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
              Scalable
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
