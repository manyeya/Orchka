"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function CursorFollower() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const cursor = cursorRef.current;

    if (!cursor) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    // Smooth follow
    gsap.ticker.add(() => {
      cursorX += (mouseX - cursorX) * 0.2;
      cursorY += (mouseY - cursorY) * 0.2;
      gsap.set(cursor, { x: cursorX, y: cursorY });
    });

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    document.addEventListener("mousemove", handleMouseMove);

    // Hover effects - instant snap
    const handleMouseEnter = () => {
      gsap.set(cursor, {
        scale: 1.5,
      });
    };

    const handleMouseLeave = () => {
      gsap.set(cursor, {
        scale: 1,
      });
    };

    // Attach to interactive elements
    const attachToElements = () => {
      const elements = document.querySelectorAll("a, button, .interactive");
      elements.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
        el.addEventListener("mouseenter", handleMouseEnter);
        el.addEventListener("mouseleave", handleMouseLeave);
      });
    };

    attachToElements();
    const interval = setInterval(attachToElements, 2000);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
      gsap.ticker.remove(() => {});
    };
  });

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 z-[9999] hidden md:block will-change-transform mix-blend-difference"
      style={{
        width: 12,
        height: 12,
        backgroundColor: "var(--primary)",
      }}
    />
  );
}
