---
name: awwwards-website
description: Create award-winning creative websites using Next.js, GSAP, Three.js, and modern web technologies. Comprehensive guide covering design thinking, motion design, typography, storytelling, and technical implementations from Awwwards and Codrops.
---

# Awwwards-Worthy Website Creation Skill

---

## Overview

This skill provides comprehensive guidance for building Awwwards-winning websites that balance artistic excellence with technical performance. It synthesizes design thinking methodologies, motion design principles, typography best practices, storytelling techniques, and cutting-edge technical implementations used in award-winning sites.

**When to use this skill:**

- Creating portfolio or agency websites aiming for Awwwards recognition
- Building immersive, narrative-driven web experiences
- Implementing scroll-triggered animations and 3D experiences
- Balancing creativity with performance and accessibility
- Following Codrops-style creative coding patterns

---

## Core Principles

### The Awwwards Evaluation Framework

Awwwards evaluates websites across four weighted criteria:

- **Design (40%)**: Visual aesthetics, creativity, originality
- **Usability (30%)**: Navigation, accessibility, user experience
- **Creativity (20%)**: Innovation, unique approaches, storytelling
- **Content (10%)**: Quality, relevance, clarity of information

Award levels include Site of the Day (SOTD), Site of the Month (SOTM), and the prestigious Site of the Year (SOTY).

### The 2024 Site of the Year Benchmark: Igloo Inc

Igloo Inc won Site of the Year 2024 by combining:

- **Immersive 3D experience** with easy-to-navigate scroll interaction
- **First-class attention to detail**, micro-interactions, and effects
- **Technical excellence**: WebGL with custom procedural algorithms
- **Performance achievement**: LCP of ~1 second on both desktop and mobile

Key technologies used: Houdini, Blender, Figma, Svelte, GSAP, three-mesh-bhv, Vite.

---

## Design Thinking for Creative Web Development

### The Creative Design Process

Follow this framework for building award-winning creative websites:

**Phase 1: Research & Discovery**

- Gather inspiration from Awwwards, Codrops, Behance, Dribbble
- Create moodboards for UI, typography, motion, photography
- Define target audience and emotional objectives
- Identify key narrative elements and user journey

**Phase 2: Concept Development**

- Create storyboards and user journey maps
- Define visual language (colors, typography, imagery style)
- Plan animation strategy and motion vocabulary
- Establish technical architecture and performance budgets

**Phase 3: Prototyping**

- Build interactive wireframes with scroll triggers
- Create animation prototypes using GSAP
- Test narrative flow with real users
- Iterate based on feedback and performance metrics

**Phase 4: Production**

- Implement full designs with component architecture
- Integrate 3D elements and WebGL effects
- Optimize for performance and accessibility
- Test across devices and browsers

### Balancing Creativity with Usability

The key challenge in creative web development:

**Visual Appeal (Creativity)**

- Bold typography and experimental type treatments
- Immersive 3D graphics and WebGL effects
- Sophisticated animations and micro-interactions
- Unique layouts and non-standard navigation

**Robust Functionality (Usability)**

- Clear navigation and intuitive user flow
- Fast load times despite visual complexity
- Accessibility compliance (WCAG 2.2)
- Responsive design across all devices

**The Balance Strategy**

1. Define clear goals and user personas to align creative ideas with user needs
2. Simplify navigation and layout while maintaining visual impact
3. Test creative concepts with real users to validate usability
4. Use visual design purposefully to enhance rather than distract
5. Prioritize performance from the start

### Design Systems for Creative Websites

Modern creative websites need structured design systems:

**Core Components**

- Design tokens (colors, typography, spacing, motion)
- Reusable UI elements (buttons, cards, navigation)
- Animation presets and motion patterns
- Accessibility guidelines and reduced motion alternatives

**Recommended Design Systems**

- IBM Carbon Design System - for enterprise-grade components
- Radix Primitives - unstyled, accessible building blocks
- Custom systems tailored to brand identity

---

## Motion Design Principles

### Animation Fundamentals

**The 12 Principles of UI/UX Animation:**

1. **Timing**: Animation timing makes interactions feel natural. Match duration to complexity.
2. **Easing**: Control acceleration and deceleration for organic motion:
   - `ease-in`: Starts slow, accelerates
   - `ease-out`: Starts fast, decelerates
   - `ease-in-out`: Combines both behaviors
   - `cubic-bezier`: Custom timing for precise control
   - Spring physics: Realistic motion with tension and friction

**Physics-Based Animation Example (Framer Motion):**

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

### Scroll-Triggered Animations

**Modern Approaches to Scroll Animations:**

**1. Intersection Observer API + GSAP:**

```javascript
const revealSection = function (entries, observer) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    gsap.to(entry.target, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power2.out",
    });
    observer.unobserve(entry.target);
  });
};
```

**2. CSS Scroll-Driven Animations (Native):**

```css
@supports (animation-timeline: scroll()) {
  .element {
    animation: fade-in linear both;
    animation-timeline: view();
    animation-range: entry 10% cover 30%;
  }
}
```

**3. GSAP ScrollTrigger (Industry Standard):**

```javascript
gsap.from(".reveal", {
  scrollTrigger: {
    trigger: ".reveal",
    start: "top 80%",
    end: "top 30%",
    toggleActions: "play none none reverse",
    scrub: 1,
  },
  opacity: 0,
  y: 100,
  duration: 1,
});
```

### Parallax Effects

**Performance-Optimized Parallax:**

```css
/* Good parallax implementation */
.parallax-layer {
  position: fixed;
  transform: translateZ(0);
  will-change: transform;
}
```

**GSAP Parallax with ScrollTrigger:**

```javascript
gsap.to(".parallax", {
  scrollTrigger: {
    trigger: ".container",
    start: "top top",
    end: "bottom top",
    scrub: true,
  },
  y: 500,
  ease: "none",
});
```

### Page Transitions

**View Transition API (Modern Standard):**

```javascript
document.startViewTransition(() => {
  updatePageContent();
});
```

**Custom Transition Animations:**

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
  }
}

@keyframes slideFromRight {
  from {
    transform: translateX(100%);
  }
}

@keyframes slideToLeft {
  to {
    transform: translateX(-100%);
  }
}

::view-transition-old(body) {
  animation:
    90ms cubic-bezier(0.4, 0, 1, 1) both fadeOut,
    300ms cubic-bezier(0.4, 0, 0.2, 1) both slideToLeft;
}

::view-transition-new(body) {
  animation:
    210ms cubic-bezier(0, 0, 0.2, 1) 90ms both fadeIn,
    300ms cubic-bezier(0.4, 0, 0.2, 1) both slideFromRight;
}
```

### Micro-Interactions

**Button Feedback:**

```css
.button {
  transition:
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.2s ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button:active {
  transform: translateY(0);
}
```

**Staggered List Animations:**

```css
.list-item {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.4s ease-out,
    transform 0.4s ease-out;
}

.list-item:nth-child(1) {
  transition-delay: 0ms;
}
.list-item:nth-child(2) {
  transition-delay: 100ms;
}
.list-item:nth-child(3) {
  transition-delay: 200ms;
}
.list-item:nth-child(4) {
  transition-delay: 300ms;
}
.list-item:nth-child(5) {
  transition-delay: 400ms;
}

.list-item.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Performance-Optimized Animations

**Critical Performance Principles:**

1. **Only Animate Compositing Properties:**

```css
/* Good: Only animate transform and opacity */
.good-animation {
  transition:
    transform 0.3s ease-out,
    opacity 0.3s ease-out;
}

/* Bad: Animating layout properties */
.bad-animation {
  transition:
    width 0.3s,
    height 0.3s,
    top 0.3s,
    left 0.3s;
}
```

2. **GPU Acceleration:**

```css
.gpu-accelerated {
  transform: translate3d(0, 0, 0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}
```

3. **Batch DOM Updates:**

```javascript
// Good practice - cache computed values
let top = el.offsetTop,
  left = el.offsetLeft,
  elStyle = el.style;
for (let i = 0; i < len; i++) {
  top += 10;
  left += 10;
  elStyle.top = `${top}px`;
  elStyle.left = `${left}px`;
}
```

### Accessibility for Motion

**Respect User Preferences:**

```css
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    transition: none;
  }

  .animated-element.fade-in {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

**Comprehensive Accessibility Pattern:**

```css
.animated-component {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: enter-animation 0.4s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .animated-component {
    transition: none;
    animation: none;
    opacity: 1 !important;
    transform: none !important;
  }
}
```

---

## Typography in Creative Websites

### Typography Trends in Award-Winning Sites

**2025 Trends:**

- Oversized type dominating hero sections
- High-contrast typography for immediate visual impact
- Experimental font pairings (display + body)
- Variable fonts for dynamic typography
- 3D typography and animated text
- AI-generated and personalized typefaces

**Notable Examples:**

- MOTION.ED - Kinetic typography focus
- Haus - Minimalist typography approach
- Cosmos Studio - Experimental typography

### Variable Fonts and Creative Type

**Variable Fonts Overview:**
Single-file flexibility enabling smooth transitions between weights, widths, and styles.

**CSS Implementation:**

```css
@font-face {
  font-family: "Rubik";
  src:
    url("/fonts/Rubik-VariableFont_wght.woff2")
      format("woff2 supports variations"),
    url("/fonts/Rubik-VariableFont_wght.woff2") format("woff2-variations");
  font-weight: 1 999;
  font-display: optional;
}
```

**Scroll-Driven Variable Font Animation:**

```css
scroll-timeline: --page-scroll block;

.to-thin {
  animation: to-thin 1s linear forwards;
  animation-timeline: --page-scroll;
}

@keyframes to-thin {
  from {
    font-weight: 900;
  }
  to {
    font-weight: 100;
  }
}
```

### Kinetic Typography

**GSAP SplitText Implementation:**

```javascript
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

const revealText = (element) => {
  const text = new SplitType(element, { types: "words, chars" });

  gsap.from(text.chars, {
    opacity: 0,
    y: 100,
    stagger: 0.02,
    duration: 1,
    ease: "power4.out",
    scrollTrigger: {
      trigger: element,
      start: "top 80%",
      end: "bottom 20%",
      toggleActions: "play none none reverse",
    },
  });
};
```

**CSS Text Reveal Effect:**

```css
.text-reveal {
  clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0% 100%);
  transition: clip-path 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.text-reveal.visible {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);
}

/* Blurry reveal */
.blurry-reveal {
  filter: blur(20px);
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s ease-out;
}

.blurry-reveal.visible {
  filter: blur(0);
  opacity: 1;
  transform: translateY(0);
}
```

### Typography Hierarchy and Readability

**WCAG 2.2 Accessibility Requirements:**

- Normal text: 4.5:1 minimum contrast ratio
- Large text (18pt+ or 14pt bold): 3:1 minimum
- UI components: 3:1 for graphical objects

**Modern Text Spacing Support:**

```css
p {
  line-height: 1.5 !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
  margin-bottom: 2em !important;
}
```

**CSS text-wrap Properties:**

```css
h1,
h2,
h3,
h4,
h5,
h6,
blockquote {
  text-wrap: balance;
}

p,
article,
.prose {
  text-wrap: pretty;
}

.prose {
  max-inline-size: 65ch;
  margin-inline: auto;
}
```

**Fluid Type Scale:**

```css
:root {
  --fs-xs: clamp(0.75rem, 0.21vw + 0.71rem, 0.88rem);
  --fs-sm: clamp(0.9rem, 0.32vw + 0.84rem, 1.09rem);
  --fs-base: clamp(1rem, 0.5vw + 0.875rem, 1.25rem);
  --fs-lg: clamp(1.25rem, 0.75vw + 1.1rem, 1.56rem);
  --fs-xl: clamp(1.56rem, 1.1vw + 1.35rem, 1.95rem);
  --fs-2xl: clamp(1.95rem, 1.5vw + 1.65rem, 2.44rem);
  --fs-3xl: clamp(2.44rem, 2vw + 2rem, 3rem);
}
```

### Font Loading Optimization

**Font Display Strategies:**

```css
/* Recommended for most cases */
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter-Variable.woff2") format("woff2");
  font-display: swap;
}

/* Best for performance */
@font-face {
  font-family: "WebFont";
  src: url("/fonts/webfont.woff2") format("woff2");
  font-display: optional;
}
```

**Font Preloading:**

```html
<link
  rel="preload"
  href="/fonts/critical-font.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

**Font Loading API:**

```javascript
if ("fonts" in document) {
  const font = new FontFace("CustomFont", "url(/fonts/custom.woff2)");

  font
    .load()
    .then((loadedFont) => {
      document.fonts.add(loadedFont);
      document.documentElement.classList.add("fonts-loaded");
    })
    .catch((error) => {
      console.error("Font loading failed:", error);
    });
}
```

---

## Web Storytelling and Scrollytelling

### Narrative Design Patterns

**Core Narrative Elements:**

- **Audience Understanding**: Define who the story is for and their emotional triggers
- **Purpose Clarity**: Establish what emotional response the narrative should evoke
- **Character Development**: Create relatable personas (brand as protagonist, user as hero)
- **Context Setting**: Establish the world and environment of the narrative
- **Structural Design**: Organize into story arcs with clear beginning, middle, resolution

**Award-Winning Narrative Patterns:**

**Kubrick Life Website (FWA + Awwwards):**

- Treated site as cinematic experience with chronological narration
- Unique scroll animations to separate film sections
- Gamification elements integrated into narrative
- Old-school color palette evoking vintage cinema

**Working Stiff Films (Awwwards):**

- "Built as one continuous scrolling journey, not stitched sections"
- Used GSAP ScrollTrigger to orchestrate single timeline
- Motion explicitly treated as narrative through pacing and visual attitude

### Scrollytelling Implementation

**Definition:**
Scrollytelling combines scrolling with animation, video, and interactive graphics to reveal content progressively as users scroll.

**Technical Implementation Libraries:**

**1. GSAP ScrollTrigger (Industry Standard):**

```javascript
const tl = gsap.timeline({
  scrollTrigger: {
    scrub: 1,
    pin: true,
    trigger: "#pin-section",
    start: "50% 50%",
    endTrigger: "#pin-section-wrap",
    end: "bottom 50%",
  },
});

tl.to("#element", {
  rotateZ: 900,
});
```

**2. BSMNT Scrollytelling (React):**

```javascript
import * as Scrollytelling from "@bsmnt/scrollytelling";

const Component = () => (
  <Scrollytelling.Root>
    <div className="container">
      <Scrollytelling.Animation
        tween={{ start: 0, end: 30, from: { opacity: 0, scale: 0.9 } }}
      >
        <h1 className="title">Hello World</h1>
      </Scrollytelling.Animation>
    </div>
  </Scrollytelling.Root>
);
```

**3. React Three Fiber + Drei ScrollControls:**

```jsx
<ScrollControls pages={3} damping={0.1}>
  <SomeModel />
  <Scroll>
    <Foo position={[0, 0, 0]} />
    <Foo position={[0, viewport.height, 0]} />
    <Foo position={[0, viewport.height * 2, 0]} />
  </Scroll>
  <Scroll html>
    <h1>HTML content here</h1>
  </Scroll>
</ScrollControls>
```

### Visual Storytelling Through Motion

**Motion as Narrative Element:**

- Use animation timing to control pacing
- Create emotional peaks through animation intensity
- Guide users through narrative with motion cues
- Use parallax for depth and immersion

**Cinematic Motion Techniques:**

```javascript
gsap.to(".cinematic-element", {
  scrollTrigger: {
    trigger: ".cinematic-section",
    start: "top bottom",
    end: "bottom top",
    scrub: true,
  },
  scale: 1.5,
  opacity: 0.8,
  filter: "blur(5px)",
});
```

### Emotional Design and User Engagement

**Three-Tier Emotional Model:**

1. **Visceral (Immediate)**: Initial visual impression and aesthetic appeal
2. **Behavioral (Interaction)**: Experience during use and interaction design
3. **Reflective (Long-term)**: Meaning and brand relationship after interaction

**Emotional Engagement Techniques:**

- Color psychology for mood and emotion
- Authentic photography creating relatability
- Typography conveying brand personality
- Motion quality affecting emotional response
- Microinteractions providing delightful feedback
- Pacing maintaining engagement rhythm

**Measuring Emotional Impact:**

- Time on page (narrative absorption indicator)
- Scroll depth (content consumption)
- Interaction rate (user engagement)
- Return visits (brand resonance)
- Social sharing (emotional content resonance)

---

## Next.js for Creative Development

### Server and Client Components Architecture

**Next.js 14+ App Router:**

```tsx
// Server Component - Ideal for static content and SEO
import Logo from "./logo";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav>
        <Logo />
      </nav>
      <main>{children}</main>
    </>
  );
}

// Client Component - For interactive animations
("use client");
import { useRef } from "react";
import gsap from "gsap";

export default function AnimatedHero() {
  const elementRef = useRef(null);

  useEffect(() => {
    gsap.from(elementRef.current, {
      opacity: 0,
      y: 100,
      duration: 1.5,
    });
  }, []);

  return (
    <div ref={elementRef}>
      <h1>Creative Animations</h1>
    </div>
  );
}
```

### Dynamic Imports for Heavy Animation Components

```tsx
import dynamic from "next/dynamic";

const ThreeScene = dynamic(() => import("@/components/ThreeScene"), {
  ssr: false,
  loading: () => <div className="loading">Loading 3D experience...</div>,
});

export default function Page() {
  return (
    <main>
      <ThreeScene />
    </main>
  );
}
```

### Animation Libraries Integration

**GSAP with Next.js 14+:**

```bash
npm install gsap @gsap/react
```

```tsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollAnimation() {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".animate-item",
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          scrollTrigger: {
            trigger: ".animate-item",
            start: "top 80%",
            end: "top 20%",
            scrub: 1,
          },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef}>
      <div className="animate-item">Creative Content</div>
    </div>
  );
}
```

**Framer Motion Page Transitions:**

```tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

const variants = {
  hidden: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function PageTransition({ children }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={variants}
        initial="hidden"
        animate="enter"
        exit="exit"
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Three.js and React Three Fiber:**

```bash
npm install three @react-three/fiber @react-three/drei
```

```tsx
"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Environment, Float } from "@react-three/drei";

function AnimatedModel() {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.scale.lerp(
        new THREE.Vector3(
          hovered ? 1.2 : 1,
          hovered ? 1.2 : 1,
          hovered ? 1.2 : 1,
        ),
        0.1,
      );
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <torusKnotGeometry args={[1, 0.3, 100, 16]} />
        <meshStandardMaterial color={hovered ? "#ff6b6b" : "#4ecdc4"} />
      </mesh>
    </Float>
  );
}

export default function ThreeScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <AnimatedModel />
      <Environment preset="city" />
    </Canvas>
  );
}
```

### Performance Optimization

**CSS vs JavaScript Animation:**

```css
.smooth-element {
  will-change: transform, opacity;
  transform: translateZ(0);
}
```

**Memory Management with GSAP Context:**

```tsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function OptimizedAnimation() {
  const contextRef = useRef(null);

  useEffect(() => {
    contextRef.current = gsap.context(() => {
      gsap.to(".animated", { x: 100, duration: 1 });
    });

    return () => {
      contextRef.current?.revert();
    };
  }, []);

  return <div className="animated">Content</div>;
}
```

**Bundle Optimization:**

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;
```

### Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (Server Component)
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   └── projects/
│       └── [slug]/
│           └── page.tsx    # Dynamic project pages
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── animations/         # Animation components
│   │   ├── ScrollReveal.tsx
│   │   ├── ParallaxSection.tsx
│   │   └── PageTransition.tsx
│   ├── canvas/             # Three.js/R3F components
│   │   ├── Scene3D.tsx
│   │   └── AnimatedModel.tsx
│   └── layout/             # Layout components
│       └── Navigation.tsx
├── hooks/
│   ├── useScroll.ts        # Custom scroll hooks
│   ├── useMousePosition.ts
│   └── usePerformance.ts
├── lib/
│   ├── gsap.ts             # GSAP configuration
│   ├── three.ts            # Three.js utilities
│   └── utils.ts
└── styles/
    └── animations.css      # CSS animations
```

---

## GSAP Animation Mastery

### Core Animation Methods

```javascript
import gsap from "gsap";

// Tween - animate from current state to target
gsap.to(".element", {
  duration: 1,
  x: 100,
  y: 50,
  opacity: 0.5,
  rotation: 45,
  ease: "power2.out",
});

// Tween - animate from specific values to target
gsap.from(".element", {
  duration: 1,
  x: -100,
  opacity: 0,
});

// Tween - define both start and end values
gsap.fromTo(
  ".element",
  { x: 0, scale: 1 },
  { x: 200, scale: 1.5, duration: 1 },
);
```

### ScrollTrigger Mastery

**Basic Scroll Animations:**

```javascript
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Fade in on scroll
gsap.from(".reveal", {
  scrollTrigger: {
    trigger: ".reveal",
    start: "top 80%",
    end: "top 30%",
    toggleActions: "play none none reverse",
  },
  opacity: 0,
  y: 100,
  duration: 1,
});

// Pin element during scroll
gsap.to(".pinned-section", {
  scrollTrigger: {
    trigger: ".pinned-section",
    pin: true,
    start: "top top",
    end: "+=500",
    scrub: 1,
  },
  scale: 2,
  rotation: 360,
});

// Parallax effect
gsap.to(".parallax", {
  scrollTrigger: {
    trigger: ".container",
    start: "top top",
    end: "bottom top",
    scrub: true,
  },
  y: 500,
  ease: "none",
});
```

**Horizontal Scroll Section:**

```javascript
const sections = gsap.utils.toArray(".horizontal-section");
gsap.to(sections, {
  xPercent: -100 * (sections.length - 1),
  ease: "none",
  scrollTrigger: {
    trigger: ".horizontal-container",
    pin: true,
    scrub: 1,
    snap: 1 / (sections.length - 1),
    end: () =>
      "+=" + document.querySelector(".horizontal-container").offsetWidth,
  },
});
```

**ScrollTrigger Callbacks:**

```javascript
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".progress-section",
    start: "top center",
    end: "bottom center",
    scrub: true,
    onUpdate: (self) => {
      console.log("Progress:", self.progress.toFixed(3));
    },
    onEnter: () => console.log("Entered viewport"),
    onLeave: () => console.log("Left viewport"),
  },
});

tl.to(".progress-bar", { width: "100%" });
```

### Timeline Animations

**Basic Timeline:**

```javascript
let tl = gsap.timeline();
tl.to("#green", { duration: 1, x: 786 })
  .to("#blue", { duration: 2, x: 786 })
  .to("#orange", { duration: 1, x: 786 });
```

**Position Parameters:**

```javascript
let tl = gsap.timeline();

tl.to(".box1", { x: 100, duration: 1 })
  .to(".box2", { x: 100, duration: 1 }, 0) // Start at time 0
  .to(".box3", { x: 100, duration: 1 }, "+=1") // 1 second after
  .to(".box4", { x: 100, duration: 1 }, "-=0.5") // 0.5 seconds before
  .to(".box5", { x: 100, duration: 1 }, "<"); // Start with previous
```

**Nested Timelines:**

```javascript
function firstTimeline() {
  return gsap
    .timeline()
    .to(".el1", { x: 100, duration: 1 })
    .to(".el2", { y: 50, duration: 0.5 });
}

function secondTimeline() {
  return gsap
    .timeline()
    .to(".el3", { rotation: 360, duration: 1 })
    .to(".el4", { scale: 1.5, duration: 0.5 });
}

let masterTl = gsap.timeline();
masterTl
  .add(firstTimeline())
  .addLabel("afterFirst")
  .add(secondTimeline(), "+=2")
  .to(".el5", { opacity: 0, duration: 1 }, "-=1");
```

### Performance Optimization

**GPU Acceleration:**

```javascript
gsap.set(".accelerated", { force3D: true });

gsap.to(".optimized", {
  duration: 1,
  x: 300,
  willChange: "transform",
  onComplete: () => {
    gsap.set(".optimized", { willChange: "auto" });
  },
});
```

**Context-Based Cleanup:**

```javascript
let ctx = gsap.context(() => {
  gsap.to(".temp", { duration: 1, x: 100 });
  gsap.to(".temp2", { duration: 1, y: 100 });
}, ".container");

// Later, kill all animations
ctx.revert();
```

**Responsive Animations with matchMedia:**

```javascript
let mm = gsap.matchMedia();

mm.add("(min-width: 800px)", () => {
  gsap.to(".hero", {
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
    y: 300,
  });
});

mm.add("(max-width: 799px)", () => {
  gsap.to(".hero", {
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
    y: 100,
  });
});
```

### Creative Effects

**SplitText Animations (Now Free!):**

```javascript
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const split = new SplitText(".hero-text", {
  type: "chars,words,lines",
});

gsap.from(split.chars, {
  duration: 1,
  opacity: 0,
  y: 100,
  rotationX: -90,
  stagger: 0.02,
  ease: "back.out(1.7)",
});
```

**Hover Effects:**

```javascript
// Magnetic button effect
document.querySelectorAll(".magnetic-btn").forEach((btn) => {
  btn.addEventListener("mousemove", (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(btn, {
      x: x * 0.3,
      y: y * 0.3,
      duration: 0.3,
      ease: "power2.out",
    });
  });

  btn.addEventListener("mouseleave", () => {
    gsap.to(btn, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)",
    });
  });
});
```

---

## Codrops Design Patterns

### What is Codrops?

Codrops (tympanus.net/codrops) has been "Fueling web creativity since 2009." Founded and maintained by creative developers, Codrops is one of the most influential resources for cutting-edge web animation and creative coding.

**Core Design Philosophy:**

- High-performance, immersive motion using GSAP, WebGL, R3F
- Technical excellence with production-ready code
- Community empowerment through open-source demos
- Experimentation-driven creative development

### Animation Techniques from Codrops

**Primary Animation Stack:**

- **GSAP** with ScrollTrigger, ScrollSmoother, Flip, SplitText
- **Three.js** for 3D grids, projection mapping, image manipulation
- **React Three Fiber** for declarative 3D scenes
- **Custom Shaders** for GLSL effects, blur transitions, displacement

**Key Animation Patterns:**

**1. Scroll-Driven Dual-Wave Text:**

```javascript
class DualWaveText {
  constructor() {
    this.columns = document.querySelectorAll(".column");
    this.image = document.querySelector(".sync-image");
    this.init();
  }

  init() {
    this.columns.forEach((column, i) => {
      const direction = i === 0 ? 1 : -1;
      gsap.to(column, {
        y: (i) => i * Math.sin(i) * 100,
        ease: "none",
        scrollTrigger: {
          trigger: column,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
        },
      });
    });
  }
}
```

**2. 3D Scroll Text Effects:**

```css
.text-cylinder {
  transform-style: preserve-3d;
  transform: rotateX(var(--rotateX)) rotateY(var(--rotateY));
}

.text-tube {
  perspective: 1000px;
  transform: translateZ(var(--z-offset)) rotateY(var(--rotation));
}
```

**3. Interactive WebGL Grid:**

```javascript
const distance = mousePosition.distanceTo(cardPosition);
const scale = THREE.MathUtils.lerp(1, 1.2, Math.max(0, 1 - distance / 200));
cardMesh.scale.setScalar(scale);
```

**4. Shader-Based Image Transitions:**

```glsl
uniform float uBlurAmount;
uniform float uMixFactor;

void main() {
  vec4 tex1 = texture2D(uTexture1, vUv);
  vec4 tex2 = texture2D(uTexture2, vUv);
  vec4 blurred = kawaseBlur(tex1, uBlurAmount);
  gl_FragColor = mix(blurred, tex2, uMixFactor);
}
```

### Creative Coding Examples

**Multi-Layer Page Transitions:**

```css
.transition-item {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
}

.transition-effect-move .transition-item {
  background: #fff;
  transform: scaleY(0);
  transform-origin: bottom;
  animation: movePageUp 0.5s forwards;
}

@keyframes movePageUp {
  to {
    transform: scaleY(1);
    transform-origin: top;
  }
}
```

**Hover Motion Intro Animation:**

```javascript
const rows = document.querySelectorAll(".motion-row");
document.addEventListener("mousemove", (e) => {
  const x = e.clientX / window.innerWidth;
  rows.forEach((row, i) => {
    const speed = (i + 1) * 20;
    gsap.to(row, {
      x: x * speed,
      duration: 0.5,
      ease: "power2.out",
    });
  });
});
```

### Design Trends from Codrops (2024-2025)

1. **Cinematic 3D Scroll Experiences**
   - Orchestrating camera paths, lighting, and shader effects with scroll
   - Integration of GSAP with React Three Fiber

2. **Real-Time Creative Coding**
   - ASCII and dithering effects with WebGL shaders
   - GPU-based simulations using WebGPU and TSL

3. **Performance-First WebGL**
   - Using R3F over vanilla Three.js for better performance
   - Replacing expensive effects with mathematical approximations

4. **Immersive Micro-Interactions**
   - Rive-powered animations for hero images and CTAs

5. **MeshPortal Techniques**
   - Rendering bounded 3D scenes onto planes within main scenes

### Awwwards-Worthy Implementation Checklist

Based on Codrops techniques:

✅ **Scroll-Driven Motion**: Implement scroll-triggered 3D effects with GSAP ScrollTrigger
✅ **WebGL Integration**: Add shader-based image transitions and 3D elements
✅ **Smooth Scrolling**: Use Lenis for premium feel
✅ **Micro-Interactions**: Rive-powered hover states on CTAs and images
✅ **Page Transitions**: Multi-layer reveal effects with SVG morphing
✅ **Performance**: Optimize WebGL with R3F and shader-based effects
✅ **Typography**: SplitText animations synchronized with scroll

---

## Performance Standards for Award-Winning Sites

### Core Web Vitals Targets (2024)

- **LCP (Largest Contentful Paint)**: < 2.5 seconds
- **INP (Interaction to Next Paint)**: < 200ms (replaced FID in March 2024)
- **CLS (Cumulative Layout Shift)**: < 0.1

### Optimization Techniques

**LCP Optimization:**

```html
<!-- Use fetchpriority="high" for LCP images -->
<img src="hero.jpg" fetchpriority="high" alt="Hero" />
```

```javascript
// Inline critical CSS, preload essential resources
// Server-Side Rendering (SSR) over CSR
// Remove loading="lazy" from LCP elements
```

**INP Optimization:**

```javascript
// Break up long tasks using Scheduler API
// Avoid unnecessary JavaScript through code splitting
// Use passive event listeners
// Offload non-urgent tasks to background threads
```

**CLS Optimization:**

```css
/* Set explicit dimensions for images/videos */
img,
video,
iframe {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
}

/* Use transform and opacity for animations */
.animated-element {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
```

### WebGL Performance Optimization

**Off-main-thread Architecture:**

```javascript
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen }, [offscreen]);
```

**Batched Rendering:**

```javascript
import { BatchedMesh } from "three";
const batchedMesh = new BatchedMesh(count, geometry, material);
```

**Texture Compression:**

- DRACO compression for 3D models
- KTX2 textures for optimized GPU rendering

### Performance Budget Strategy

Set explicit performance budgets:

- Initial JS bundle: < 200KB (gzipped)
- Total blocking time: < 200ms
- Time to interactive: < 3.5s
- Animation frame budget: 16.67ms (60fps)

---

## Design Trends 2024-2025

### Visual Design Trends

- **Brutalism & Neo-Brutalism**: Raw aesthetics, minimalism, bold typography
- **Creative Typography**: Variable fonts, 3D typography, experimental treatments
- **Gradient Colors**: Multicolored gradients, vibrant palettes, irregular shapes
- **Dark Mode**: Careful contrast consideration
- **Glassmorphism & Neumorphism**: Subtle translucency and depth effects

### UX/UI Trends

- **Interactive Storytelling**: Narrative-driven experiences
- **Gamification**: Interactive elements like scores, challenges, puzzles
- **Micro-interactions**: Purposeful animations enhancing usability
- **Performance-First Design**: Fast loading despite visual complexity

### Technical Trends

- **View Transitions API**: Native page transitions
- **CSS Scroll-Driven Animations**: Native scroll animations
- **Container Queries**: Component-based responsive design
- **WebGPU**: Next-generation 3D rendering

---

## Recommended Tools & Resources

### Design Inspiration

- Awwwards (awwwards.com)
- Codrops (tympanus.net/codrops)
- Behance (behance.net)
- Dribbble (dribbble.com)
- Best Website Gallery (bestwebsite.gallery)

### Development Tools

- Next.js 14+ (React framework)
- GSAP + @gsap/react (Animation)
- Three.js + React Three Fiber (3D)
- Lenis (Smooth scrolling)
- Framer Motion (UI transitions)

### Design Tools

- Figma (Design)
- Blender (3D modeling)
- Spline (3D for web)
- Rive (Interactive animations)

### Performance Testing

- Lighthouse (Chrome DevTools)
- WebPageTest (webpagetest.org)
- SpeedCurve (Performance monitoring)

---

## Success Factors Summary

### Design Excellence

✅ Innovative yet functional design
✅ Strong visual hierarchy and typography
✅ Cohesive color scheme and branding
✅ Creative use of white space

### Technical Excellence

✅ Fast load times despite visual complexity
✅ Smooth animations (60fps target)
✅ Responsive across all devices
✅ Accessibility compliance

### User Experience

✅ Intuitive navigation
✅ Engaging storytelling
✅ Micro-interactions that delight
✅ Performance that doesn't compromise experience

### Creativity

✅ Original concepts
✅ Technical innovation
✅ Emotional connection
✅ Memorable experiences

---

## Quick Reference: Animation Properties

### CSS Properties for Animation (GPU-Accelerated)

- `transform` (translate, rotate, scale, skew)
- `opacity`
- `filter` (some properties)
- `will-change` (sparingly)

### Properties to Avoid Animating

- `width`, `height`
- `margin`, `padding`
- `top`, `left`, `right`, `bottom`
- `border`, `border-radius` (can be expensive)

### Easing Functions

- `linear`: Constant speed
- `ease`: Default (starts slow, speeds up, slows down)
- `ease-in`: Starts slow, ends fast
- `ease-out`: Starts fast, ends slow
- `ease-in-out`: Combination of ease-in and ease-out
- `power1/2/3/4`: Cubic bezier curves
- `back`: Overshoot animation
- `elastic`: Spring-like oscillation
- `bounce`: Bouncing effect

### GSAP Plugins

- ScrollTrigger: Scroll-driven animations
- SplitText: Typography animations (FREE)
- MorphSVG: Shape morphing (FREE)
- Flip: State-based layout animations
- DrawSVG: SVG stroke animations
- Physics2D/Physics3D: Physics-based motion

---

## Implementation Workflow

### Phase 1: Discovery (1-2 weeks)

1. Research inspiration and create moodboards
2. Define target audience and emotional objectives
3. Identify key narrative elements and user journey
4. Establish technical architecture and performance budgets

### Phase 2: Design (2-3 weeks)

1. Create storyboards and user journey maps
2. Define visual language (colors, typography, imagery)
3. Plan animation strategy and motion vocabulary
4. Design responsive layouts and interactions

### Phase 3: Prototype (2-3 weeks)

1. Build interactive wireframes with scroll triggers
2. Create animation prototypes using GSAP
3. Test narrative flow with real users
4. Iterate based on feedback and performance metrics

### Phase 4: Production (4-6 weeks)

1. Implement full designs with component architecture
2. Integrate 3D elements and WebGL effects
3. Optimize for performance and accessibility
4. Test across devices and browsers

### Phase 5: Launch (1-2 weeks)

1. Performance testing and optimization
2. Accessibility audit
3. Cross-browser testing
4. Launch and monitor

---

## Resources

### Official Documentation

- Next.js: nextjs.org/docs
- GSAP: gsap.com/docs
- React Three Fiber: docs.pmnd.rs/react-three-fiber
- MDN Web Docs: developer.mozilla.org

### Learning Resources

- Awwwards Academy: awwwards.com/academy
- GSAP Learning Resources: gsap.com/resources
- Codrops Tutorials: tympanus.net/codrops/category/tutorials
- Three.js Journey: threejs-journey.com

### Communities

- GSAP Forums: gsap.com/community/forums
- Reactiflux (Discord): reactiflux.com
- WebDev Discord: discord.gg/webdev

---

## References

This skill synthesizes research from:

- Awwwards evaluation criteria and case studies
- Codrops creative coding tutorials and patterns
- GSAP documentation and best practices
- Next.js 14+ App Router documentation
- WebGL and Three.js performance guides
- WCAG 2.2 accessibility guidelines
- Core Web Vitals performance standards
- Design thinking methodologies from IDEO and Stanford d.school
