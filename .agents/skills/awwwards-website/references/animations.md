# Animation Patterns Reference

This file contains detailed animation patterns and implementations for Awwwards-worthy websites.

## Scroll-Triggered Animations

### Basic Reveal Animation

```tsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function RevealAnimation() {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      // Fade up reveal
      gsap.fromTo(
        ".reveal-up",
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".reveal-up",
            start: "top 85%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        },
      );

      // Scale reveal
      gsap.fromTo(
        ".reveal-scale",
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".reveal-scale",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      );

      // Rotation reveal
      gsap.fromTo(
        ".reveal-rotate",
        { rotation: -15, opacity: 0, scale: 0.9 },
        {
          rotation: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".reveal-rotate",
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef}>
      <div className="reveal-up">Fade Up Content</div>
      <div className="reveal-scale">Scale Reveal</div>
      <div className="reveal-rotate">Rotation Reveal</div>
    </div>
  );
}
```

### Parallax Effects

```tsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ParallaxSection() {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      // Background parallax (moves slower than scroll)
      gsap.to(".parallax-bg", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      // Foreground parallax (moves faster than scroll)
      gsap.to(".parallax-fg", {
        yPercent: -20,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      // Mouse-follow parallax
      const parallaxElements = gsap.utils.toArray(".mouse-parallax");
      document.addEventListener("mousemove", (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        parallaxElements.forEach((el: any, i) => {
          const depth = (i + 1) * 10;
          gsap.to(el, {
            x: x * depth,
            y: y * depth,
            duration: 1,
            ease: "power2.out",
          });
        });
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", overflow: "hidden", height: "100vh" }}
    >
      <div
        className="parallax-bg"
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      >
        <img
          src="/bg.jpg"
          alt="Background"
          style={{ width: "100%", height: "120%", objectFit: "cover" }}
        />
      </div>
      <div
        className="parallax-fg"
        style={{ position: "relative", zIndex: 1, padding: "2rem" }}
      >
        <h1>Parallax Content</h1>
      </div>
      <div
        className="mouse-parallax"
        style={{ position: "absolute", top: "20%", left: "10%" }}
      >
        Floating Element 1
      </div>
      <div
        className="mouse-parallax"
        style={{ position: "absolute", top: "60%", right: "10%" }}
      >
        Floating Element 2
      </div>
    </div>
  );
}
```

### Pinning Sections

```tsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function PinnedSection() {
  const containerRef = useRef(null);
  const pinRef = useRef(null);
  const contentRef = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinRef.current,
          start: "top top",
          end: "+=300%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // Animate through content states
      tl.to(contentRef.current, { scale: 1.5, rotation: 360, duration: 1 })
        .to(contentRef.current, { backgroundColor: "#ff6b6b", duration: 0.5 })
        .to(contentRef.current, { scale: 1, rotation: 0, duration: 0.5 })
        .to(contentRef.current, { backgroundColor: "#4ecdc4", duration: 0.5 });
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef}>
      <div
        ref={pinRef}
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          ref={contentRef}
          style={{
            width: 300,
            height: 300,
            backgroundColor: "#4ecdc4",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "1.5rem",
          }}
        >
          Pinned & Animated Content
        </div>
      </div>
    </div>
  );
}
```

### Horizontal Scroll Section

```tsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HorizontalScroll() {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const sectionsRef = useRef([]);

  useGSAP(
    () => {
      const sections = sectionsRef.current;
      const totalWidth = sections.length * 100;

      gsap.to(sections, {
        xPercent: -100 * (sections.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          pin: true,
          scrub: 1,
          snap: {
            snapTo: 1 / (sections.length - 1),
            duration: { min: 0.2, max: 0.5 },
            delay: 0.1,
            ease: "power1.inOut",
          },
          end: () => `+=${wrapperRef.current.offsetWidth}`,
        },
      });
    },
    { scope: containerRef },
  );

  const cards = ["Section 1", "Section 2", "Section 3", "Section 4"];

  return (
    <div ref={containerRef}>
      <div
        ref={wrapperRef}
        style={{
          display: "flex",
          width: "400%",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {cards.map((text, i) => (
          <section
            key={i}
            ref={(el) => (sectionsRef.current[i] = el)}
            style={{
              width: "100vw",
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: i % 2 === 0 ? "#1a1a2e" : "#16213e",
              color: "white",
            }}
          >
            <h1 style={{ fontSize: "4rem" }}>{text}</h1>
          </section>
        ))}
      </div>
    </div>
  );
}
```

### Image Sequence Animation

```tsx
"use client";
import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ImageSequence() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [images, setImages] = useState([]);

  useEffect(() => {
    // Preload images
    const loadedImages = [];
    const totalFrames = 60;

    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      img.src = `/sequence/frame_${i.toString().padStart(3, "0")}.jpg`;
      loadedImages.push(img);
    }

    setImages(loadedImages);
  }, []);

  useGSAP(
    () => {
      if (images.length === 0 || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const container = containerRef.current;

      // Set canvas size
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;

      // Draw first frame
      ctx.drawImage(images[0], 0, 0, canvas.width, canvas.height);

      // Scroll-triggered animation
      const frameCount = images.length;
      const currentFrame = { index: 0 };

      gsap.to(currentFrame, {
        index: frameCount - 1,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
        },
        onUpdate: () => {
          const frameIndex = Math.round(currentFrame.index);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(images[frameIndex], 0, 0, canvas.width, canvas.height);
        },
      });
    },
    { scope: containerRef, dependencies: [images] },
  );

  return (
    <div ref={containerRef} style={{ height: "300vh" }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "100vh",
          objectFit: "cover",
        }}
      />
    </div>
  );
}
```

## Text Animations

### SplitText Character Reveal

```tsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SplitTextReveal() {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      const textElements = gsap.utils.toArray(".split-text");

      textElements.forEach((text) => {
        // Create SplitText-like effect manually
        const chars = text.textContent.split("").map((char) => {
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          span.style.display = "inline-block";
          span.style.opacity = "0";
          span.style.transform = "translateY(100px)";
          return span;
        });

        text.innerHTML = "";
        chars.forEach((char) => text.appendChild(char));

        gsap.to(chars, {
          opacity: 1,
          y: 0,
          rotationX: 0,
          stagger: 0.02,
          duration: 0.8,
          ease: "back.out(2)",
          scrollTrigger: {
            trigger: text,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });
      });
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} style={{ padding: "4rem" }}>
      <h1 className="split-text" style={{ fontSize: "4rem", lineHeight: 1.2 }}>
        Award Winning Animations
      </h1>
      <h1
        className="split-text"
        style={{ fontSize: "4rem", lineHeight: 1.2, marginTop: "2rem" }}
      >
        Scroll Triggered Effects
      </h1>
    </div>
  );
}
```

### Text Scramble Effect

```tsx
"use client";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function TextScramble() {
  const textRef = useRef(null);
  const [displayText, setDisplayText] = useState("");
  const originalText = "CREATIVE DEVELOPER";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

  const scramble = () => {
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayText(
        originalText
          .split("")
          .map((letter, index) => {
            if (index < iterations) {
              return originalText[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join(""),
      );

      if (iterations >= originalText.length) {
        clearInterval(interval);
      }

      iterations += 1 / 3;
    }, 30);
  };

  useGSAP(() => {
    scramble();
  });

  return (
    <div
      ref={textRef}
      onMouseEnter={scramble}
      style={{
        fontSize: "3rem",
        fontWeight: "bold",
        cursor: "pointer",
        fontFamily: "monospace",
      }}
    >
      {displayText}
    </div>
  );
}
```

### Kinetic Typography

```tsx
"use client";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function KineticTypography() {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      const letters = gsap.utils.toArray(".kinetic-letter");

      // Wave effect on scroll
      letters.forEach((letter: any, i) => {
        gsap.to(letter, {
          y: -50,
          rotation: Math.sin(i * 0.5) * 20,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });

      // Hover wave effect
      letters.forEach((letter: any, i) => {
        letter.addEventListener("mouseenter", () => {
          gsap.to(letter, {
            y: -30,
            scale: 1.5,
            color: "#ff6b6b",
            duration: 0.3,
            ease: "power2.out",
          });
          gsap.to(letter, {
            y: 0,
            scale: 1,
            color: "inherit",
            delay: 0.3,
            duration: 0.3,
          });
        });
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        overflow: "hidden",
        justifyContent: "center",
        fontSize: "5rem",
        fontWeight: "bold",
        whiteSpace: "nowrap",
      }}
    >
      {"KINETIC".split("").map((char, i) => (
        <span
          key={i}
          className="kinetic-letter"
          style={{ display: "inline-block" }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
```

## Micro-Interactions

### Magnetic Button

```tsx
"use client";
import { useRef, useState } from "react";
import gsap from "gsap";

export default function MagneticButton({
  children,
}: {
  children: React.ReactNode;
}) {
  const buttonRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const button = buttonRef.current as HTMLElement;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(button, {
      x: x * 0.5,
      y: y * 0.5,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)",
    });
    setIsHovered(false);
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      style={{
        padding: "1rem 2rem",
        fontSize: "1rem",
        border: "none",
        borderRadius: "50px",
        backgroundColor: isHovered ? "#ff6b6b" : "#1a1a2e",
        color: "white",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </button>
  );
}
```

### Cursor Follower

```tsx
"use client";
import { useRef, useEffect } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const followerRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;

    const moveCursor = (e: MouseEvent) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
      });
      gsap.to(follower, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.3,
      });
    };

    window.addEventListener("mousemove", moveCursor);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        style={{
          position: "fixed",
          width: 10,
          height: 10,
          backgroundColor: "#ff6b6b",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 9999,
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        ref={followerRef}
        style={{
          position: "fixed",
          width: 40,
          height: 40,
          border: "2px solid #ff6b6b",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 9998,
          transform: "translate(-50%, -50%)",
        }}
      />
    </>
  );
}
```

### Animated Card Hover

```tsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function AnimatedCard() {
  const cardRef = useRef(null);
  const contentRef = useRef(null);
  const imageRef = useRef(null);

  useGSAP(
    () => {
      const card = cardRef.current;
      const content = contentRef.current;
      const image = imageRef.current;

      card.addEventListener("mousemove", (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        gsap.to(card, {
          perspective: 1000,
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          duration: 0.3,
        });

        gsap.to(content, {
          y: -10,
          duration: 0.3,
        });

        gsap.to(image, {
          scale: 1.1,
          duration: 0.3,
        });
      });

      card.addEventListener("mouseleave", () => {
        gsap.to(card, {
          perspective: 1000,
          transform: "rotateX(0) rotateY(0)",
          duration: 0.5,
          ease: "power2.out",
        });

        gsap.to(content, {
          y: 0,
          duration: 0.3,
        });

        gsap.to(image, {
          scale: 1,
          duration: 0.3,
        });
      });
    },
    { scope: cardRef },
  );

  return (
    <div
      ref={cardRef}
      style={{
        width: 350,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "white",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        cursor: "pointer",
      }}
    >
      <div ref={imageRef} style={{ height: 200, overflow: "hidden" }}>
        <img
          src="/card-image.jpg"
          alt="Card"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div ref={contentRef} style={{ padding: "1.5rem" }}>
        <h3 style={{ margin: "0 0 0.5rem" }}>Card Title</h3>
        <p style={{ margin: 0, color: "#666" }}>
          This card has a smooth 3D tilt effect on hover with content animation.
        </p>
      </div>
    </div>
  );
}
```

## Page Transitions

### View Transition API

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useViewTransition() {
  const router = useRouter();

  const transition = useCallback((callback: () => void) => {
    if (!document.startViewTransition) {
      callback();
      return;
    }

    document.startViewTransition(callback);
  }, []);

  const push = (href: string) => {
    transition(() => {
      router.push(href);
    });
  };

  return { push };
}
```

### Curtain Transition

```tsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function CurtainTransition() {
  const curtainRef = useRef(null);

  useGSAP(
    () => {
      const curtain = curtainRef.current;

      // Animate curtain on mount
      gsap.set(curtain, { scaleY: 1, transformOrigin: "bottom" });
      gsap.to(curtain, {
        scaleY: 0,
        transformOrigin: "top",
        duration: 0.8,
        ease: "power2.inOut",
        delay: 0.2,
      });
    },
    { scope: curtainRef },
  );

  return (
    <div
      ref={curtainRef}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#1a1a2e",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}
```

## Stagger Animations

### Card Stagger Grid

```tsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function StaggerGrid() {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray(".stagger-card");

      gsap.from(cards, {
        y: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "2rem",
        padding: "4rem",
      }}
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="stagger-card"
          style={{
            height: 300,
            backgroundColor: i % 2 === 0 ? "#1a1a2e" : "#16213e",
            borderRadius: 16,
            padding: "2rem",
            color: "white",
          }}
        >
          <h3>Card {i}</h3>
          <p>Animated with staggered reveal effect</p>
        </div>
      ))}
    </div>
  );
}
```

### List Stagger Animation

```tsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function ListStagger() {
  const containerRef = useRef(null);
  const itemsRef = useRef([]);

  useGSAP(
    () => {
      itemsRef.current.forEach((item, i) => {
        const icon = item.querySelector(".list-icon");
        const text = item.querySelector(".list-text");

        // Initial animation
        gsap.set(item, { x: -50, opacity: 0 });
        gsap.set(icon, { rotation: -180, opacity: 0 });

        // Staggered reveal
        gsap.to(item, {
          x: 0,
          opacity: 1,
          duration: 0.5,
          delay: i * 0.1,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(icon, {
              rotation: 0,
              opacity: 1,
              duration: 0.5,
              ease: "back.out(1.7)",
            });
          },
        });
      });
    },
    { scope: containerRef },
  );

  const items = [
    "Design",
    "Development",
    "Animation",
    "3D Graphics",
    "Performance",
  ];

  return (
    <div ref={containerRef} style={{ padding: "4rem" }}>
      {items.map((item, i) => (
        <div
          key={i}
          ref={(el) => (itemsRef.current[i] = el)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1.5rem",
            marginBottom: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: 12,
          }}
        >
          <div
            className="list-icon"
            style={{
              width: 40,
              height: 40,
              backgroundColor: "#ff6b6b",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            →
          </div>
          <span className="list-text" style={{ fontSize: "1.2rem" }}>
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}
```
