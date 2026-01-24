"use client";

import { useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function CursorFollower() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorOuterRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const cursor = cursorRef.current;
    const cursorOuter = cursorOuterRef.current;

    if (!cursor || !cursorOuter) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let cursorOuterX = 0;
    let cursorOuterY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    document.addEventListener("mousemove", handleMouseMove);

    // Smooth cursor animation
    gsap.ticker.add(() => {
      const dt = 1.0;

      // Inner cursor (fast)
      cursorX += (mouseX - cursorX) * 0.2;
      cursorY += (mouseY - cursorY) * 0.2;
      gsap.set(cursor, { x: cursorX, y: cursorY });

      // Outer cursor (slower)
      cursorOuterX += (mouseX - cursorOuterX) * 0.1;
      cursorOuterY += (mouseY - cursorOuterY) * 0.1;
      gsap.set(cursorOuter, { x: cursorOuterX, y: cursorOuterY });
    });

    // Hover effects on interactive elements
    const interactiveElements = document.querySelectorAll("a, button, .interactive");

    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", () => {
        gsap.to(cursor, { scale: 0.5, duration: 0.3 });
        gsap.to(cursorOuter, { scale: 2, duration: 0.3 });
      });

      el.addEventListener("mouseleave", () => {
        gsap.to(cursor, { scale: 1, duration: 0.3 });
        gsap.to(cursorOuter, { scale: 1, duration: 0.3 });
      });
    });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      gsap.ticker.remove(() => {});
    };
  });

  return (
    <>
      <div
        ref={cursorOuterRef}
        className="pointer-events-none fixed top-0 left-0 w-12 h-12 border border-[var(--primary)] rounded-full -translate-x-1/2 -translate-y-1/2 z-[9999] hidden md:block mix-blend-difference"
      />
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 w-3 h-3 bg-[var(--primary)] rounded-full -translate-x-1/2 -translate-y-1/2 z-[9999] hidden md:block mix-blend-difference"
      />
    </>
  );
}
