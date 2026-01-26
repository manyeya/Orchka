"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MousePointer2, Activity, GitBranch } from "lucide-react";

export function ProductShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const imageInnerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

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

    // Title animation
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

    // Glow follow effect
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
          trigger: ".feature-cards-container",
          start: "top 85%",
        },
      }
    );

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

  const features = [
    {
      icon: MousePointer2,
      title: "Drag & Drop",
      desc: "Intuitive visual workflow builder",
    },
    {
      icon: Activity,
      title: "Real-time",
      desc: "Live execution monitoring",
    },
    {
      icon: GitBranch,
      title: "Connections",
      desc: "Powerful node linking system",
    },
  ];

  // Handle mouse move on cards for border gradient effect
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const card = cardRefs.current[index];
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update CSS variables for gradient position
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 md:py-40 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-[var(--accent)] to-[var(--background)]" />

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
                <img
                  src="orckha.png"
                  alt="Orchka Workflow Editor Interface"
                  width={2830}
                  height={1674}
                  className="w-full h-auto"
                />

                {/* Shine effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
              </div>

              {/* Shadow */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-black/20 blur-xl rounded-[100%]" />
            </div>
          </div>
        </div>

        {/* Feature highlights with animated border */}
        <div className="feature-cards-container relative mt-24 md:mt-32">
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                ref={(el) => { cardRefs.current[i] = el; }}
                className="feature-card relative group"
                onMouseMove={(e) => handleCardMouseMove(e, i)}
              >
                <div className="relative bg-[var(--background)] p-8 text-center">
                  {/* Animated gradient border */}
                  <div
                    className="absolute -inset-px rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle 150px at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--primary), transparent 100%)`,
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'exclude',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      padding: '1px',
                    }}
                  />

                  {/* Base border */}
                  <div className="absolute -inset-px border border-[var(--border)] rounded-sm pointer-events-none" />

                  {/* Icon */}
                  <div className="relative mb-5 inline-flex">
                    <div className="p-3 transition-all duration-300 bg-[var(--muted)] group-hover:bg-[var(--primary)]/10">
                      <feature.icon className="w-6 h-6 text-[var(--foreground)]" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="font-mono text-sm uppercase tracking-wider mb-3 text-[var(--foreground)]">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
