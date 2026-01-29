"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  trigger?: boolean;
  wordAnimation?: "fade" | "slide" | "reveal";
}

export function SplitText({
  text,
  className = "",
  delay = 0,
  stagger = 0.05,
  trigger = true,
  wordAnimation = "slide",
}: SplitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(" ");

  useGSAP(() => {
    if (!trigger) return;

    const wordElements = containerRef.current?.querySelectorAll(".split-word");
    if (!wordElements) return;

    const animations = {
      fade: { opacity: 0, to: { opacity: 1 } },
      slide: { y: 100, opacity: 0, to: { y: 0, opacity: 1 } },
      reveal: {
        clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)",
        to: { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)" },
      },
    };

    const anim = animations[wordAnimation];

    gsap.set(wordElements, anim);

    gsap.to(wordElements, {
      ...anim.to,
      duration: 1,
      stagger: stagger,
      ease: "power4.out",
      delay: delay,
    });
  }, { scope: containerRef, dependencies: [text, delay, stagger, trigger, wordAnimation] });

  return (
    <div ref={containerRef} className={cn("overflow-hidden", className)}>
      {words.map((word, i) => (
        <span key={i} className="split-word inline-block mr-[0.25em]">
          {word}
        </span>
      ))}
    </div>
  );
}
