"use client";

import { ArrowRight, Terminal, ChevronDown } from "lucide-react";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MagneticButton } from "../ui/magnetic-button";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      defaults: { ease: "power4.out" },
    });

    // Badge - quick fade in from top
    tl.fromTo(
      badgeRef.current,
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
      0
    );

    // Title - character by character reveal with stagger
    const titleChars = titleRef.current?.querySelectorAll(".char") || [];
    tl.fromTo(
      titleChars,
      { y: 100, opacity: 0, rotateX: -90 },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 0.8,
        stagger: 0.03,
        ease: "power3.out",
      },
      0.3
    );

    // Subtitle - smooth slide up with slight delay
    tl.fromTo(
      subtitleRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      0.7
    );

    // Description - fade in with slide
    tl.fromTo(
      descriptionRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      0.85
    );

    // CTA buttons - stagger entrance
    const buttons = ctaRef.current?.querySelectorAll("a") || [];
    tl.fromTo(
      buttons,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)" },
      1
    );

    // Tech badges - subtle fade in
    tl.fromTo(
      ".tech-badge",
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out" },
      1.2
    );

    // Scroll indicator - continuous bounce after delay
    gsap.fromTo(
      scrollRef.current,
      { y: 0 },
      {
        y: 10,
        duration: 0.75,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        delay: 1.8,
      }
    );

    // Floating orbs - subtle continuous motion
    gsap.to(".floating-orb-1", {
      y: -20,
      x: 15,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.to(".floating-orb-2", {
      y: 25,
      x: -20,
      duration: 7,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.5,
    });

    gsap.to(".floating-orb-3", {
      y: -15,
      x: -10,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 1,
    });

    return () => {
      tl.kill();
      gsap.killTweensOf([scrollRef.current, ".floating-orb-1", ".floating-orb-2", ".floating-orb-3"]);
    };
  }, { scope: containerRef });

  // Split text into characters for animation
  const title = "Orchka";

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[var(--primary)] rounded-full blur-[150px] animate-pulse floating-orb-1" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[var(--secondary)] rounded-full blur-[120px] animate-pulse floating-orb-2" />
          <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-[var(--primary)] rounded-full blur-[100px] opacity-50 floating-orb-3" />
        </div>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[80px_80px] opacity-[0.03] pointer-events-none" />

      <div className="container relative z-10 flex flex-col items-center text-center px-4 md:px-8 max-w-7xl mx-auto">
        {/* Animated badge */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-3 px-5 py-2.5 border border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md mb-8"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--primary)]"></span>
          </span>
          <span className="text-xs font-mono text-[var(--foreground)] uppercase tracking-[0.2em] font-medium">
            Orchka v0.1.0 — Open Source
          </span>
        </div>

        {/* Main title with character animation */}
        <h1
          ref={titleRef}
          className="text-[12vw] md:text-[10vw] lg:text-[120px] font-bold tracking-tighter mb-6 uppercase font-mono leading-[0.9] perspective-1000"
        >
          {title.split("").map((char, i) => (
            <span
              key={i}
              className="char inline-block will-change-transform"
              style={{ display: "inline-block" }}
            >
              {char}
            </span>
          ))}
        </h1>

        {/* Animated subtitle */}
        <p
          ref={subtitleRef}
          className="text-lg md:text-2xl lg:text-3xl text-[var(--foreground)] max-w-3xl mb-4 font-light"
        >
          Workflow Orchestration
          <span className="text-[var(--primary)] mx-3">•</span>
          Reimagined
        </p>

        <p
          ref={descriptionRef}
          className="text-[var(--muted-foreground)] text-base md:text-lg max-w-2xl mb-12 leading-relaxed"
        >
          Build intelligent automations with visual workflows, AI agents, and durable execution.
          <br className="hidden md:block" />
          Powered by Next.js, React Flow, and BullMQ.
        </p>

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 mb-20">
          <MagneticButton href="/docs" variant="primary" className="cta-button interactive text-black!">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </MagneticButton>
          <MagneticButton
            href="https://github.com/manyeya/Orchka"
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            className="cta-button interactive"
          >
            <Terminal className="w-4 h-4" />
            View Source
          </MagneticButton>
        </div>

        {/* Tech stack badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16 md:mb-0">
          <span className="tech-badge px-3 py-1.5 border border-[var(--border)] text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
            Next.js 15
          </span>
          <span className="tech-badge text-[var(--primary)]">•</span>
          <span className="tech-badge px-3 py-1.5 border border-[var(--border)] text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
            React Flow
          </span>
          <span className="tech-badge text-[var(--primary)]">•</span>
          <span className="tech-badge px-3 py-1.5 border border-[var(--border)] text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
            BullMQ
          </span>
          <span className="tech-badge text-[var(--primary)]">•</span>
          <span className="tech-badge px-3 py-1.5 border border-[var(--border)] text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
            Prisma
          </span>
          <span className="tech-badge text-[var(--primary)]">•</span>
          <span className="tech-badge px-3 py-1.5 border border-[var(--border)] text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
            tRPC
          </span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div ref={scrollRef} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
          Scroll
        </span>
        <ChevronDown className="w-5 h-5 text-[var(--primary)]" />
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
    </section>
  );
}
