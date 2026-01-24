"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronRight } from "lucide-react";

const features = [
  "Visual Workflow Builder",
  "AI Agent Integration",
  "Durable Execution",
  "Type-Safe Architecture",
  "Real-time Telemetry",
  "JSONata Expressions",
  "BullMQ Powered",
  "React Flow Canvas",
];

export function Marquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    const marquee = marqueeRef.current;
    if (!marquee) return;

    // Calculate scroll distance
    const scrollDistance = marquee.offsetWidth / 2;

    gsap.to(marquee, {
      x: -scrollDistance,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.5,
      },
    });
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative w-full py-16 md:py-20 overflow-hidden"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[var(--background)] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[var(--background)] to-transparent z-10 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 max-w-7xl mb-8">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
            Capabilities
          </p>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          ref={marqueeRef}
          className="flex items-center gap-12 md:gap-16 whitespace-nowrap px-4"
        >
          {/* First set */}
          {features.map((feature, i) => (
            <div
              key={`first-${i}`}
              className="flex items-center gap-3 text-sm md:text-base font-mono uppercase tracking-wider text-[var(--muted-foreground)]"
            >
              <span className="w-1.5 h-1.5 bg-[var(--primary)] rotate-45" />
              {feature}
            </div>
          ))}
          <ChevronRight className="w-5 h-5 text-[var(--primary)]" />

          {/* Duplicate for seamless loop */}
          {features.map((feature, i) => (
            <div
              key={`second-${i}`}
              className="flex items-center gap-3 text-sm md:text-base font-mono uppercase tracking-wider text-[var(--muted-foreground)]"
            >
              <span className="w-1.5 h-1.5 bg-[var(--primary)] rotate-45" />
              {feature}
            </div>
          ))}
          <ChevronRight className="w-5 h-5 text-[var(--primary)]" />
        </div>
      </div>
    </section>
  );
}
