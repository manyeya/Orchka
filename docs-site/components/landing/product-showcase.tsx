"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

export function ProductShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const imageInnerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    // Badge animation
    gsap.fromTo(
      badgeRef.current,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: badgeRef.current,
          start: "top 90%",
        },
      }
    );

    // Title animation - split text reveal
    const titleChars = titleRef.current?.querySelectorAll(".char") || [];
    gsap.fromTo(
      titleChars,
      { y: 60, opacity: 0, rotateX: -90 },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 0.8,
        stagger: 0.03,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 85%",
        },
      }
    );

    // Parallax effect on image container
    gsap.to(containerRef.current, {
      yPercent: -10,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });

    // Glow follow effect - follows mouse within container
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !glowRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.to(glowRef.current, {
        x: x - rect.width / 2,
        y: y - rect.height / 2,
        duration: 0.5,
        ease: "power2.out",
      });
    };

    // 3D tilt effect on image
    const handleMouseMove3D = (e: MouseEvent) => {
      if (!imageInnerRef.current) return;
      const rect = imageInnerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateY = ((e.clientX - centerX) / rect.width) * 5;
      const rotateX = -((e.clientY - centerY) / rect.height) * 5;

      gsap.to(imageInnerRef.current, {
        rotateX,
        rotateY,
        duration: 0.4,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      if (!imageInnerRef.current) return;
      gsap.to(imageInnerRef.current, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)",
      });
    };

    section.addEventListener("mousemove", handleMouseMove as EventListener);
    if (imageInnerRef.current) {
      imageInnerRef.current.addEventListener("mousemove", handleMouseMove3D as EventListener);
      imageInnerRef.current.addEventListener("mouseleave", handleMouseLeave as EventListener);
    }

    // Reveal animation for the product image
    gsap.fromTo(
      imageRef.current,
      {
        y: 100,
        opacity: 0,
        scale: 0.95,
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: imageRef.current,
          start: "top 80%",
        },
      }
    );

    // Feature cards stagger animation
    const featureCards = section.querySelectorAll(".feature-card");
    gsap.fromTo(
      featureCards,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".feature-card",
          start: "top 85%",
        },
      }
    );

    // Floating animation for orbs
    gsap.to(".product-orb-1", {
      y: -30,
      x: 20,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.to(".product-orb-2", {
      y: 25,
      x: -15,
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 1,
    });

    return () => {
      section.removeEventListener("mousemove", handleMouseMove as EventListener);
      if (imageInnerRef.current) {
        imageInnerRef.current.removeEventListener("mousemove", handleMouseMove3D as EventListener);
        imageInnerRef.current.removeEventListener("mouseleave", handleMouseLeave as EventListener);
      }
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const title = "The Interface";

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 md:py-40 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-[var(--accent)] to-[var(--background)]" />

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="product-orb-1 absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--primary)] rounded-full blur-[200px] opacity-15" />
        <div className="product-orb-2 absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[var(--secondary)] rounded-full blur-[250px] opacity-10" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[100px_100px] opacity-[0.02] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
        {/* Badge */}
        <div className="text-center mb-8">
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-3 px-5 py-2.5 border border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md"
          >
            <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
            <span className="text-xs font-mono text-[var(--foreground)] uppercase tracking-[0.2em] font-medium">
              Visual Editor
            </span>
          </div>
        </div>

        {/* Title */}
        <div
          ref={titleRef}
          className="text-center mb-12 md:mb-20 perspective-1000"
        >
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter uppercase font-mono leading-[0.9]">
            {title.split("").map((char, i) => (
              <span
                key={i}
                className="char inline-block will-change-transform"
                style={{ display: char === " " ? "inline" : "inline-block" }}
              >
                {char}
              </span>
            ))}
          </h2>
        </div>

        {/* Product Image Container */}
        <div ref={containerRef} className="relative flex justify-center items-center">
          {/* Glow effect */}
          <div
            ref={glowRef}
            className="absolute inset-0 bg-[var(--primary)] rounded-[20px] blur-[100px] opacity-20 pointer-events-none"
            style={{ transform: "translate(-50%, -50%)" }}
          />

          {/* Image wrapper with 3D effect */}
          <div className="relative w-full max-w-5xl">
            <div
              ref={(el) => {
                imageRef.current = el;
                imageInnerRef.current = el;
              }}
              className="relative will-change-transform"
              style={{
                transformStyle: "preserve-3d",
                perspective: "1000px",
              }}
            >
              {/* Product Image */}
              <div className="relative w-full rounded-xl overflow-hidden shadow-2xl border border-[var(--border)]">
                <Image
                  src="/orckha.png"
                  alt="Orchka Workflow Editor Interface"
                  width={2830}
                  height={1674}
                  className="w-full h-auto"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                />

                {/* Shine effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
              </div>

              {/* Shadow */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-black/20 blur-xl rounded-[100%]" />
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 md:mt-24">
          {[
            {
              icon: "◉",
              title: "Drag & Drop",
              desc: "Intuitive visual workflow builder",
            },
            {
              icon: "⚡",
              title: "Real-time",
              desc: "Live execution monitoring",
            },
            {
              icon: "↔",
              title: "Connections",
              desc: "Powerful node linking system",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="feature-card text-center p-6 border border-[var(--border)] bg-[var(--background)]/50 backdrop-blur-sm hover:border-[var(--primary)] transition-colors duration-300 cursor-default"
            >
              <span className="text-3xl mb-4 block text-[var(--primary)]">
                {feature.icon}
              </span>
              <h3 className="font-mono text-sm uppercase tracking-wider mb-2 text-[var(--foreground)]">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
