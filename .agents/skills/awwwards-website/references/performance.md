# Performance Optimization Reference

This file contains comprehensive performance optimization strategies for Awwwards-worthy websites.

## Core Web Vitals Optimization

### Largest Contentful Paint (LCP)

**Target: < 2.5 seconds**

**Optimization Strategies:**

```tsx
// 1. Preload critical images
import Head from "next/head";

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <link
          rel="preload"
          href="/images/hero.webp"
          as="image"
          type="image/webp"
        />
      </Head>
      {/* ... */}
    </>
  );
}

// 2. Use fetchpriority for LCP images
export function HeroImage() {
  return (
    <img
      src="/hero.jpg"
      alt="Hero"
      fetchpriority="high"
      loading="eager"
      srcSet="/hero-400.webp 400w, /hero-800.webp 800w, /hero-1200.webp 1200w"
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
}

// 3. Inline critical CSS
// next.config.js
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
};

// 4. Server-side rendering for LCP content
// app/page.tsx (Server Component)
export default async function Page() {
  const heroData = await fetchHeroData();

  return (
    <main>
      <h1>{heroData.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: heroData.content }} />
    </main>
  );
}

// 5. Optimize font loading
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### Interaction to Next Paint (INP)

**Target: < 200ms**

**Optimization Strategies:**

```tsx
// 1. Break up long tasks
function processData(data: number[]) {
  const chunkSize = 100;
  let index = 0;

  function processChunk() {
    const end = Math.min(index + chunkSize, data.length);

    for (let i = index; i < end; i++) {
      // Process item
    }

    index = end;

    if (index < data.length) {
      // Schedule next chunk
      setTimeout(processChunk, 0);
    }
  }

  processChunk();
}

// 2. Use requestIdleCallback for non-critical work
useEffect(() => {
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(() => {
      // Non-critical initialization
      initializeAnalytics();
      initializeTracking();
    });
  } else {
    setTimeout(() => {
      initializeAnalytics();
      initializeTracking();
    }, 1000);
  }
}, []);

// 3. Passive event listeners
document.addEventListener("scroll", handleScroll, { passive: true });

// 4. Use useMemo for expensive calculations
const expensiveResult = useMemo(() => {
  return computeExpensiveValue(dep1, dep2);
}, [dep1, dep2]);

// 5. Debounce scroll events
function useDebouncedScroll(callback: Function, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handler = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback();
      }, delay);
    };

    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [callback, delay]);
}
```

### Cumulative Layout Shift (CLS)

**Target: < 0.1**

**Optimization Strategies:**

```tsx
// 1. Set explicit aspect ratios
.image-container {
  aspect-ratio: 16 / 9;
  width: 100%;
}

.video-container {
  aspect-ratio: 16 / 9;
  width: 100%;
}

// 2. Reserve space for ads
.ad-container {
  min-height: 250px;
  background-color: #f5f5f5;
}

// 3. Font display strategies
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap;
  size-adjust: 110%;
}

// 4. Use CSS transforms for animations (no layout recalculation)
.animated-element {
  transform: translateX(0);
  will-change: transform;
  transition: transform 0.3s ease;
}

// Avoid animating these properties:
.avoid-animating {
  /* These trigger layout recalculation */
  width: 100px;      /* ❌ */
  height: 100px;     /* ❌ */
  padding: 20px;     /* ❌ */
  margin: 10px;      /* ❌ */
  top: 0;            /* ❌ */
  left: 0;           /* ❌ */
}

// 5. Image placeholders
.image-with-placeholder {
  background: linear-gradient(
    to right,
    #f0f0f0 0%,
    #e0e0e0 50%,
    #f0f0f0 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## JavaScript Performance

### Code Splitting

```tsx
// Dynamic imports for heavy components
import dynamic from "next/dynamic";

const ThreeScene = dynamic(() => import("@/components/ThreeScene"), {
  ssr: false,
  loading: () => <SkeletonLoader />,
});

const HeavyAnimation = dynamic(() => import("@/components/HeavyAnimation"), {
  loading: () => <div>Loading animation...</div>,
});

// Route-based code splitting (Next.js App Router)
// app/dashboard/page.tsx - loaded separately from app/page.tsx

// Component-level code splitting
function MyComponent() {
  const HeavyChart = useMemo(() => dynamic(() => import("./HeavyChart")), []);

  return <HeavyChart data={data} />;
}
```

### Tree Shaking

```javascript
// next.config.js
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }
    return config;
  },
};

// Import only what you need
// ❌ Bad - imports entire library
import _ from "lodash";

// ✅ Good - imports specific function
import throttle from "lodash/throttle";
```

### Web Workers

```tsx
// worker.ts
self.onmessage = (event) => {
  const { data } = event;
  const result = processData(data);
  self.postMessage(result);
};

function processData(data: number[]) {
  // Expensive computation
  return data.map((x) => x * 2);
}

// useWorker.ts
import { useState, useEffect, useRef } from "react";

export function useWorker<T, R>(worker: Worker, data: T): R | null {
  const [result, setResult] = useState<R | null>(null);

  useEffect(() => {
    worker.postMessage(data);

    worker.onmessage = (event) => {
      setResult(event.data);
    };

    return () => {
      worker.terminate();
    };
  }, [worker, data]);

  return result;
}

// Usage
const worker = new Worker(new URL("./worker.ts", import.meta.url));
const result = useWorker(worker, heavyData);
```

## Animation Performance

### GPU Acceleration

```css
/* Force GPU acceleration */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Use transform instead of top/left */
.animated-element {
  transform: translateX(100px);
  transition: transform 0.3s ease;
}

/* Avoid layout-triggering properties */
.avoid-layout-properties {
  /* These trigger reflow */
  width: 100px; /* ❌ */
  height: 100px; /* ❌ */
  padding: 20px; /* ❌ */
  margin: 10px; /* ❌ */
  border: 1px solid; /* ❌ */
}
```

### GSAP Performance

```tsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export function OptimizedAnimation() {
  const contextRef = useRef(null);

  useEffect(() => {
    // Use gsap.context for automatic cleanup
    contextRef.current = gsap.context(() => {
      // Batch animations
      gsap.to(".batch-element", {
        x: 100,
        duration: 1,
        stagger: 0.1,
        ease: "power2.out",
      });
    });

    return () => {
      contextRef.current?.revert();
    };
  }, []);

  return <div className="batch-element">Element</div>;
}

// Performance optimization with will-change
gsap.to(element, {
  x: 100,
  duration: 1,
  willChange: "transform",
  onComplete: () => {
    gsap.set(element, { willChange: "auto" });
  },
});

// Use autoAlpha instead of opacity
gsap.to(element, {
  autoAlpha: 0, // Sets opacity: 0 and visibility: hidden
  duration: 1,
});
```

### Three.js Performance

```tsx
'use client';
import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 1. Use instanced meshes for many objects
function InstancedObjects({ count = 1000 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < count; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, dummy]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#4ecdc4" />
    </instancedMesh>
  );
}

// 2. Use level of detail (LOD)
function LODObject() {
  return (
    <LOD>
      <group level={0}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color="#4ecdc4" />
        </mesh>
      </group>
      <group level={1}>
        <mesh>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#4ecdc4" />
        </mesh>
      </group>
      <group level={2}>
        <mesh>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#4ecdc4" />
        </mesh>
      </group>
    </LOD>
  );
}

// 3. Dispose of resources
function CleanupExample() {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;

    return () => {
      if (mesh) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    };
  }, []);

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial />
    </mesh>
  );
}

// 4. Optimize render loop
function OptimizedRender() {
  const frameRef = useRef(0);

  useFrame(() => {
    // Skip frames if needed for performance
    frameRef.current++;
    if (frameRef.current % 2 === 0) {
      // Update on every other frame
      updateExpensiveProperty();
    }
  });

  return null;
}

// 5. Use smaller geometries
// ❌ High polygon count
<mesh>
  <sphereGeometry args={[1, 128, 128]} />
</mesh>

// ✅ Optimized polygon count
<mesh>
  <sphereGeometry args={[1, 32, 32]} />
</mesh>
```

## Image Optimization

### Next.js Image Component

```tsx
import Image from "next/image";

export function OptimizedImages() {
  return (
    <>
      {/* Responsive images with srcset */}
      <div style={{ position: "relative", width: "100%", height: 400 }}>
        <Image
          src="/hero.jpg"
          alt="Hero image"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          quality={85}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQ..."
        />
      </div>

      {/* Static sizes for predictable loading */}
      <Image
        src="/thumbnail.jpg"
        alt="Thumbnail"
        width={200}
        height={150}
        sizes="200px"
        quality={75}
      />

      {/* AVIF with WebP fallback */}
      <Image
        src="/image.avif"
        alt="AVIF image"
        width={800}
        height={600}
        priority={false}
      />
    </>
  );
}

// next.config.js image optimization
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
  },
};

module.exports = nextConfig;
```

### Lazy Loading

```tsx
// Native lazy loading
<img src="image.jpg" loading="lazy" alt="Lazy loaded" />;

// Intersection Observer lazy loading
import { useInView } from "react-intersection-observer";

function LazyImage({ src, alt }) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: "50px 0px",
  });

  return <div ref={ref}>{inView && <img src={src} alt={alt} />}</div>;
}

// Next.js dynamic imports
import dynamic from "next/dynamic";

const HeavyImage = dynamic(() => import("./HeavyImage"), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});
```

## CSS Performance

### Critical CSS

```css
/* critical.css - Inline this in <head> */
body {
  margin: 0;
  font-family: system-ui, sans-serif;
}

h1 {
  font-size: 2rem;
}

/* non-critical.css - Load async */
<link rel="preload" href="/styles/non-critical.css" as="style">
<link rel="stylesheet" href="/styles/non-critical.css" media="print" onload="this.media='all'">
```

### CSS Containment

```css
/* Isolate layout */
.isolated-element {
  contain: layout paint style;
}

/* Layout containment - internal layout doesn't affect parent */
.layout-contained {
  contain: layout;
}

/* Paint containment - element doesn't affect descendants outside it */
.paint-contained {
  contain: paint;
}

/* Content containment - both layout and paint */
.content-contained {
  contain: content;
}
```

### Will-Change Property

```css
/* Use sparingly - only when animation is about to start */
.animated-element {
  opacity: 0;
  will-change: opacity, transform;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.animated-element.visible {
  opacity: 1;
  transform: translateX(0);
}

/* Remove will-change after animation completes */
.animated-element.animation-complete {
  will-change: auto;
}
```

## Bundle Optimization

### Analyze Bundle Size

```javascript
// next.config.js bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // your config
});

// Run analysis
ANALYZE=true npm run build
```

### Remove Unused Code

```javascript
// next.config.js
const nextConfig = {
  compiler: {
    // Remove console in production
    removeConsole: process.env.NODE_ENV === "production",
  },
};

// Use ES modules for tree shaking
// ✅ Good - named imports enable tree shaking
import { debounce, throttle } from "lodash";

// ❌ Bad - default import cannot be tree shaken
import _ from "lodash";
```

### Optimize Dependencies

```json
// package.json - Use smaller alternatives
{
  "dependencies": {
    // ❌ Large libraries
    "moment": "^2.29.4",
    "lodash": "^4.17.21",

    // ✅ Smaller alternatives
    "dayjs": "^1.11.7",
    "lodash-es": "^4.17.21"
  }
}
```

## Network Optimization

### Preconnect and DNS Prefetch

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for known domains */}
        <link rel="dns-prefetch" href="https://analytics.example.com" />

        {/* Preload critical assets */}
        <link
          rel="preload"
          href="/fonts/critical.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Resource Hints

```html
<!-- Preload critical JavaScript -->
<link rel="preload" href="/js/critical.js" as="script" />

<!-- Prefetch likely-to-be-visited pages -->
<link rel="prefetch" href="/about" as="document" />

<!-- Prerender important pages -->
<link rel="prerender" href="/pricing" />

<!-- Subresource for critical CSS -->
<link rel="subresource" href="/styles/critical.css" />
```

## Caching Strategies

### Static Asset Caching

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Stale-While-Revalidate

```tsx
// For dynamic content with caching
import { unstable_cache } from "next/cache";

async function getCachedData() {
  return unstable_cache(
    async () => {
      const data = await fetchDataFromAPI();
      return data;
    },
    ["cache-key"],
    {
      revalidate: 60, // Revalidate every 60 seconds
      tags: ["data-tag"],
    },
  )();
}
```

## Performance Monitoring

### Core Web Vitals Tracking

```tsx
"use client";
import { useEffect } from "react";

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Track CLS
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          console.log("CLS:", entry.value);
          // Send to analytics
        }
      }
    });

    clsObserver.observe({ type: "layout-shift", buffered: true });

    // Track LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log("LCP:", lastEntry.renderTime || lastEntry.loadTime);
      // Send to analytics
    });

    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

    // Track FID (deprecated, use INP)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log("FID:", entry.processingStart - entry.startTime);
        // Send to analytics
      }
    });

    fidObserver.observe({ type: "first-input", buffered: true });

    // Track INP
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log("INP:", entry.duration);
        // Send to analytics
      }
    });

    inpObserver.observe({ type: "interaction-to-next-paint", buffered: true });

    return () => {
      clsObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      inpObserver.disconnect();
    };
  }, []);

  return null;
}
```

### Performance Budget

```javascript
// performance-budget.json
{
  "resourceSizes": [
    {
      "resourceType": "total",
      "budget": 250
    },
    {
      "resourceType": "script",
      "budget": 100
    },
    {
      "resourceType": "css",
      "budget": 50
    },
    {
      "resourceType": "image",
      "budget": 200
    },
    {
      "resourceType": "font",
      "budget": 50
    },
    {
      "resourceType": "document",
      "budget": 10
    }
  ],
  "timings": [
    {
      "metric": "first-contentful-paint",
      "budget": 1800
    },
    {
      "metric": "largest-contentful-paint",
      "budget": 2500
    },
    {
      "metric": "first-input-delay",
      "budget": 100
    },
    {
      "metric": "cumulative-layout-shift",
      "budget": 0.1
    }
  ]
}
```

## Accessibility Performance

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// React reduced motion hook
import { useState, useEffect } from "react";

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handler = (event) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return reducedMotion;
}

// Usage
function AnimatedComponent() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div
      style={{
        animation: prefersReducedMotion ? "none" : "fadeIn 0.5s ease-in-out",
      }}
    >
      Content
    </div>
  );
}
```

## Performance Checklist

### Before Deployment

- [ ] Run Lighthouse performance audit (aim for 90+)
- [ ] Test on real devices (not just emulators)
- [ ] Verify Core Web Vitals are in green
- [ ] Check bundle size analysis
- [ ] Test with slow network (3G simulation)
- [ ] Verify reduced motion preferences work
- [ ] Check for layout shifts on image load
- [ ] Test animation performance (60fps)
- [ ] Verify progressive loading works
- [ ] Check cache headers are set correctly

### Production Checklist

- [ ] Enable compression (Brotli/Gzip)
- [ ] Set proper cache headers
- [ ] Use CDN for static assets
- [ ] Optimize images (WebP/AVIF)
- [ ] Minify JavaScript and CSS
- [ ] Remove development code
- [ ] Enable tree shaking
- [ ] Use code splitting
- [ ] Implement lazy loading
- [ ] Monitor performance in production
