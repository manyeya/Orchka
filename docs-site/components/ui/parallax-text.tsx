"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

interface ParallaxTextProps {
  text: string;
  className?: string;
  speed?: number;
  direction?: "left" | "right";
}

export function ParallaxText({
  text,
  className = "",
  speed = 100,
  direction = "left",
}: ParallaxTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    const textElements = containerRef.current?.querySelectorAll(".parallax-text");
    if (!textElements) return;

    const multiplier = direction === "left" ? -1 : 1;

    textElements.forEach((text) => {
      gsap.to(text, {
        x: multiplier * speed,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    });
  }, { scope: containerRef });

  // Repeat text enough times to fill screen
  const repeatedText = Array(20).fill(text).join(" • ");

  return (
    <div ref={containerRef} className={cn("flex overflow-hidden whitespace-nowrap", className)}>
      <span className="parallax-text inline-block text-[8vw] md:text-[12vw] font-bold tracking-tighter uppercase font-mono">
        {repeatedText}
      </span>
      <span className="parallax-text inline-block text-[8vw] md:text-[12vw] font-bold tracking-tighter uppercase font-mono ml-8">
        {repeatedText}
      </span>
    </div>
  );
}
