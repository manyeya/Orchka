"use client";

import { ArrowRight, Terminal, ChevronDown } from "lucide-react";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MagneticButton } from "../ui/magnetic-button";

// Logo components
function NextjsLogo() {
  return <img src="nextjs-logo.png" alt="Next.js" className="h-8 w-24 object-contain grayscale opacity-40 flex-shrink-0" />;
}

function ReactFlowLogo() {
  return <img src="reactflow-logo.svg" alt="React Flow" className="h-8 w-24 object-contain grayscale opacity-40 flex-shrink-0" />;
}

function PrismaLogo() {
  return <img src="prisma-logo.svg" alt="Prisma" className="h-8 w-24 object-contain grayscale opacity-40 flex-shrink-0" />;
}

function BullMQLogo() {
  return <img src="bullmq-logo.png" alt="BullMQ" className="h-8 w-24 object-contain grayscale opacity-40 flex-shrink-0" />;
}

function TRPCLogo() {
  return <img src="trpc-logo.svg" alt="tRPC" className="h-8 w-24 object-contain grayscale opacity-40 flex-shrink-0" />;
}

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Set initial states first to prevent jumps
    gsap.set(badgeRef.current, { y: -30, opacity: 0 });

    const titleChars = titleRef.current?.querySelectorAll(".char") || [];
    gsap.set(titleChars, { y: 100, opacity: 0, rotateX: -90 });

    gsap.set(subtitleRef.current, { y: 40, opacity: 0 });
    gsap.set(descriptionRef.current, { y: 30, opacity: 0 });

    const buttons = ctaRef.current?.querySelectorAll("a") || [];
    gsap.set(buttons, { y: 20, opacity: 0, scale: 0.95 });

    gsap.set(".tech-badge", { scale: 0.8, opacity: 0 });

    gsap.set(scrollRef.current, { y: -10, opacity: 0 });

    // Create synced timeline with proper sequencing
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Badge
    tl.to(badgeRef.current, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" });

    // Title - character by character reveal
    tl.to(titleChars, {
      y: 0,
      opacity: 1,
      rotateX: 0,
      duration: 0.8,
      stagger: 0.03,
    }, "-=0.4"); // Slight overlap for smoother feel

    // Subtitle
    tl.to(subtitleRef.current, { y: 0, opacity: 1, duration: 0.7 }, "-=0.3");

    // Description
    tl.to(descriptionRef.current, { y: 0, opacity: 1, duration: 0.7 }, "-=0.4");

    // CTA buttons - more fluid easing with scale
    tl.to(buttons, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: "power3.out",
    }, "-=0.3");

    // Tech badges
    tl.to(".tech-badge", {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      stagger: 0.05,
    }, "-=0.2");

    // Scroll indicator - separate from timeline, starts after everything
    gsap.to(scrollRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
      delay: 0.5,
      onComplete: () => {
        // Start bounce animation after fade in
        gsap.to(scrollRef.current, {
          y: 10,
          duration: 0.75,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    });

    // Floating orbs - independent continuous animations
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

        {/* Tech stack logo marquee */}
        <div className="tech-badge w-full max-w-3xl mb-16 md:mb-0">
          <div
            className="overflow-hidden"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
              maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
            }}
          >
            {/* Scrolling marquee */}
            <div className="flex items-center gap-8 md:gap-16 animate-marquee hover:pause py-4">
              {/* First set */}
              <NextjsLogo />
              <ReactFlowLogo />
              <PrismaLogo />
              <BullMQLogo />
              <TRPCLogo />

              {/* Duplicate for seamless loop */}
              <NextjsLogo />
              <ReactFlowLogo />
              <PrismaLogo />
              <BullMQLogo />
              <TRPCLogo />
            </div>
          </div>
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
