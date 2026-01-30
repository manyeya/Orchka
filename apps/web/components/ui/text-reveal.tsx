"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

interface TextRevealProps {
    text: string;
    className?: string;
    delay?: number;
    duration?: number;
    stagger?: number;
    trigger?: boolean; // If true, animation triggers on mount/prop change. If false, waits for scrollTrigger (not implemented here yet, but good for future) or manual trigger.
}

export const TextReveal = ({
    text,
    className,
    delay = 0,
    duration = 0.8,
    stagger = 0.02,
    trigger = true,
}: TextRevealProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const words = text.split(" ");

    useGSAP(() => {
        if (!trigger) return;

        const chars = containerRef.current?.querySelectorAll(".char");
        if (!chars) return;

        gsap.set(chars, {
            y: "100%",
            opacity: 0,
            rotateZ: 10,
        });

        gsap.to(chars, {
            y: "0%",
            opacity: 1,
            rotateZ: 0,
            duration: duration,
            stagger: stagger,
            ease: "power4.out",
            delay: delay,
        });
    }, { scope: containerRef, dependencies: [trigger, text, delay, duration, stagger] });

    return (
        <div
            ref={containerRef}
            className={cn("overflow-hidden leading-tight", className)}
            aria-label={text}
        >
            <span className="sr-only">{text}</span>
            {words.map((word, wordIndex) => (
                <span key={wordIndex} className="inline-block whitespace-nowrap mr-[0.25em]">
                    {word.split("").map((char, charIndex) => (
                        <span
                            key={`${wordIndex}-${charIndex}`}
                            className="char inline-block origin-bottom-left will-change-transform"
                        >
                            {char}
                        </span>
                    ))}
                </span>
            ))}
        </div>
    );
};
