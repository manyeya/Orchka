"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function CursorFollower() {
  const cursorDot = useRef<HTMLDivElement>(null);
  const cursorOutline = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const dot = cursorDot.current;
    const outline = cursorOutline.current;

    if (!dot || !outline) return;

    // Cursor position state
    let pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let dotPos = { x: pos.x, y: pos.y };
    let outlinePos = { x: pos.x, y: pos.y };

    // Track mouse movement
    const updateCursor = (e: MouseEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
    };

    // Animate cursor smoothly
    gsap.ticker.add(() => {
      // Fast follow for dot
      dotPos.x += (pos.x - dotPos.x) * 0.5;
      dotPos.y += (pos.y - dotPos.y) * 0.5;

      // Slower follow for outline
      outlinePos.x += (pos.x - outlinePos.x) * 0.15;
      outlinePos.y += (pos.y - outlinePos.y) * 0.15;

      gsap.set(dot, { x: dotPos.x, y: dotPos.y });
      gsap.set(outline, { x: outlinePos.x, y: outlinePos.y });
    });

    document.addEventListener("mousemove", updateCursor);

    // Snap hover effects - instant state changes
    const handleMouseEnter = () => {
      // Instant snap - no duration
      gsap.set(outline, {
        width: 40,
        height: 40,
        scale: 1.5,
        borderColor: "var(--primary)",
        opacity: 1,
      });
      gsap.set(dot, { scale: 0.5 });
    };

    const handleMouseLeave = () => {
      // Instant snap back
      gsap.set(outline, {
        width: 32,
        height: 32,
        scale: 1,
        borderColor: "var(--primary)",
        opacity: 0.5,
      });
      gsap.set(dot, { scale: 1 });
    };

    // Attach to all interactive elements
    const attachToElements = () => {
      const elements = document.querySelectorAll("a, button, .interactive");
      elements.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
        el.addEventListener("mouseenter", handleMouseEnter);
        el.addEventListener("mouseleave", handleMouseLeave);
      });
    };

    // Initial attachment
    attachToElements();

    // Re-attach periodically for dynamically added elements
    const interval = setInterval(attachToElements, 2000);

    return () => {
      document.removeEventListener("mousemove", updateCursor);
      clearInterval(interval);
      gsap.ticker.remove(() => {});
    };
  });

  return (
    <>
      <div
        ref={cursorOutline}
        className="pointer-events-none fixed top-0 left-0 border border-[var(--primary)] rounded-full -translate-x-1/2 -translate-y-1/2 z-[9999] hidden md:block opacity-50 will-change-transform"
        style={{ width: 32, height: 32 }}
      />
      <div
        ref={cursorDot}
        className="pointer-events-none fixed top-0 left-0 bg-[var(--primary)] rounded-full -translate-x-1/2 -translate-y-1/2 z-[9999] hidden md:block will-change-transform"
        style={{ width: 6, height: 6 }}
      />
    </>
  );
}
