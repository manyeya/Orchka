"use client";

import { ReactNode, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
}

export function MagneticButton({
  children,
  className = "",
  onClick,
  href,
  variant = "primary",
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * 0.3;
      const deltaY = (e.clientY - centerY) * 0.3;

      gsap.to(contentRef.current, {
        x: deltaX,
        y: deltaY,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(contentRef.current, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)",
      });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, { scope: ref });

  const baseStyles = "inline-flex items-center justify-center px-8 py-4 text-sm font-semibold uppercase tracking-widest font-mono transition-all duration-300 relative overflow-hidden group";

  const variantStyles = {
    primary: "bg-[var(--primary)] text-black border-2 border-[var(--primary)] hover:scale-105",
    secondary: "bg-[var(--background)] text-[var(--foreground)] border-2 border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
    outline: "bg-transparent text-[var(--foreground)] border-2 border-[var(--primary)] hover:bg-[var(--primary)] hover:text-black",
  };

  const inner = (
    <>
      <span ref={contentRef} className="relative z-10 flex items-center gap-2">{children}</span>
      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
    </>
  );

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;

  if (href) {
    return (
      <Link ref={ref as any} href={href} onClick={onClick} className={combinedClassName}>
        {inner}
      </Link>
    );
  }

  return (
    <button ref={ref as any} onClick={onClick} className={combinedClassName}>
      {inner}
    </button>
  );
}
