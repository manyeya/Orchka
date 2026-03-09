# Three.js and React Three Fiber Reference

This file contains detailed 3D implementation patterns for Awwwards-worthy websites using Three.js and React Three Fiber.

## Setup and Configuration

### Basic Next.js + R3F Setup

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
```

### next.config.js Configuration

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
};

module.exports = nextConfig;
```

### R3F Canvas Component

```tsx
"use client";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

export default function Scene3D() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4ecdc4" />
      </mesh>
    </>
  );
}
```

## 3D Objects and Materials

### Animated Mesh with Mouse Interaction

```tsx
"use client";
import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Text3D } from "@react-three/drei";
import * as THREE from "three";

function InteractiveMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Continuous rotation
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.3;

      // Smooth scale transition
      meshRef.current.scale.lerp(
        new THREE.Vector3(
          active ? 1.5 : hovered ? 1.2 : 1,
          active ? 1.5 : hovered ? 1.2 : 1,
          active ? 1.5 : hovered ? 1.2 : 1,
        ),
        0.1,
      );

      // Color interpolation
      const targetColor = new THREE.Color(
        active ? "#ff6b6b" : hovered ? "#ffbe76" : "#4ecdc4",
      );
      (meshRef.current.material as THREE.MeshStandardMaterial).color.lerp(
        targetColor,
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
        onClick={() => setActive(!active)}
      >
        <torusKnotGeometry args={[1, 0.3, 100, 16]} />
        <meshStandardMaterial
          metalness={0.5}
          roughness={0.2}
          envMapIntensity={1}
        />
      </mesh>
    </Float>
  );
}

export default function InteractiveScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <pointLight position={[-10, -10, -10]} color="#ff6b6b" />
      <InteractiveMesh />
      <Environment preset="city" />
    </Canvas>
  );
}
```

### Particles System

```tsx
"use client";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ count = 1000 }) {
  const meshRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Random positions in a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2 + Math.random() * 3;

      temp[i3] = radius * Math.sin(phi) * Math.cos(theta);
      temp[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      temp[i3 + 2] = radius * Math.cos(phi);

      // Random colors
      colors[i3] = Math.random();
      colors[i3 + 1] = Math.random();
      colors[i3 + 2] = Math.random();
    }

    return { positions: temp, colors };
  }, [count]);

  useFrame((state) => {
    if (meshRef.current) {
      // Slow rotation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticlesScene() {
  return (
    <Canvas camera={{ position: [0, 0, 10] }}>
      <color attach="background" args={["#0a0a0f"]} />
      <Particles count={2000} />
    </Canvas>
  );
}
```

### Glass Material Effect

```tsx
"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

function GlassObject() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.5, 0]} />
      <MeshTransmissionMaterial
        backside
        backsideThickness={1}
        thickness={2}
        roughness={0.1}
        transmission={1}
        ior={1.5}
        chromaticAberration={0.3}
        anisotropy={0.5}
        distortion={0.3}
        distortionScale={0.5}
        temporalDistortion={0.1}
        color="#ffffff"
        background={new THREE.Color("#0a0a0f")}
      />
    </mesh>
  );
}

export default function GlassScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <color attach="background" args={["#0a0a0f"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff6b6b" />
      <GlassObject />
    </Canvas>
  );
}
```

### Text in 3D

```tsx
"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text3D, Center, Environment } from "@react-three/drei";
import * as THREE from "three";

function Animated3DText() {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={meshRef}>
      <Center top>
        <Text3D
          font="/fonts/inter-bold.json"
          size={1}
          height={0.2}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.02}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={5}
        >
          CREATIVE
          <meshStandardMaterial
            color="#4ecdc4"
            metalness={0.8}
            roughness={0.2}
          />
        </Text3D>
      </Center>
    </group>
  );
}

export default function Text3DScene() {
  return (
    <Canvas camera={{ position: [0, 0, 8] }}>
      <color attach="background" args={["#1a1a2e"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Animated3DText />
      <Environment preset="city" />
    </Canvas>
  );
}
```

## Scroll-Driven 3D

### Scroll-Controlled Camera

```tsx
"use client";
import { useRef, useLayoutEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, useScroll } from "@react-three/drei";
import * as THREE from "three";

function CameraController() {
  const scroll = useScroll();
  const { camera } = useThree();

  useFrame(() => {
    // Scroll-based camera movement
    const offset = scroll.offset;

    // Camera follows a curved path based on scroll
    camera.position.x = Math.sin(offset * Math.PI * 2) * 3;
    camera.position.y = Math.cos(offset * Math.PI) * 2;
    camera.position.z = 5 - offset * 3;

    camera.lookAt(0, 0, 0);
  });

  return null;
}

function SceneContent() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[Math.sin(i) * 3, Math.cos(i) * 2, i * -2]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial
            color={new THREE.Color().setHSL(i / 10, 0.8, 0.5)}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function ScrollCameraScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <color attach="background" args={["#0a0a0f"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      <ScrollControls pages={5} damping={0.2}>
        <CameraController />
        <SceneContent />
      </ScrollControls>
    </Canvas>
  );
}
```

### Scroll-Triggered 3D Animation

```tsx
"use client";
import { useRef, useLayoutEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, Scroll, useScroll } from "@react-three/drei";
import * as THREE from "three";

function Animated3DObject() {
  const meshRef = useRef<THREE.Mesh>(null);
  const scroll = useScroll();

  useFrame(() => {
    if (!meshRef.current) return;

    const offset = scroll.offset;

    // Rotation based on scroll
    meshRef.current.rotation.x = offset * Math.PI * 2;
    meshRef.current.rotation.y = offset * Math.PI * 4;

    // Scale based on scroll
    const scale = 1 + offset * 0.5;
    meshRef.current.scale.setScalar(scale);

    // Position based on scroll
    meshRef.current.position.y = Math.sin(offset * Math.PI * 2) * 2;

    // Color shift based on scroll
    const hue = offset;
    (meshRef.current.material as THREE.MeshStandardMaterial).color.setHSL(
      hue,
      0.8,
      0.5,
    );
  });

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1, 0.3, 100, 16]} />
      <meshStandardMaterial metalness={0.7} roughness={0.2} />
    </mesh>
  );
}

function HTMLOverlay() {
  const scroll = useScroll();

  return (
    <Scroll html>
      <div
        style={{
          position: "absolute",
          top: "0vh",
          left: "50%",
          transform: "translateX(-50%)",
          color: "white",
          fontSize: "3rem",
        }}
      >
        Section 1
      </div>
      <div
        style={{
          position: "absolute",
          top: "100vh",
          left: "50%",
          transform: "translateX(-50%)",
          color: "white",
          fontSize: "3rem",
        }}
      >
        Section 2
      </div>
      <div
        style={{
          position: "absolute",
          top: "200vh",
          left: "50%",
          transform: "translateX(-50%)",
          color: "white",
          fontSize: "3rem",
        }}
      >
        Section 3
      </div>
    </Scroll>
  );
}

export default function Scroll3DScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <color attach="background" args={["#1a1a2e"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <ScrollControls pages={3} damping={0.3}>
        <Scroll>
          <Animated3DObject />
        </Scroll>
        <Scroll html>
          <HTMLOverlay />
        </Scroll>
      </ScrollControls>
    </Canvas>
  );
}
```

## Post-Processing Effects

### Bloom Effect

```tsx
"use client";
import { Canvas } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
} from "@react-three/postprocessing";

function GlowingScene() {
  return (
    <>
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 5,
          ]}
        >
          <sphereGeometry args={[0.1 + Math.random() * 0.2, 32, 32]} />
          <meshBasicMaterial color="#ff6b6b" toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

export default function BloomScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <color attach="background" args={["#0a0a0f"]} />
      <GlowingScene />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          height={300}
          intensity={1.5}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </Canvas>
  );
}
```

### Glitch Effect

```tsx
"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  Glitch,
  Bloom,
  Noise,
} from "@react-three/postprocessing";
import { GlitchMode } from "postprocessing";

function AnimatedGlitchObject() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial
        color="#4ecdc4"
        emissive="#4ecdc4"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

export default function GlitchScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <color attach="background" args={["#0a0a0f"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <AnimatedGlitchObject />

      <EffectComposer>
        <Bloom luminanceThreshold={0.1} intensity={0.8} />
        <Glitch
          delay={[1.5, 3.5]}
          duration={[0.6, 1.0]}
          strength={[0.3, 1.0]}
          mode={GlitchMode.SPORADIC}
          active
          ratio={0.85}
        />
        <Noise opacity={0.1} />
      </EffectComposer>
    </Canvas>
  );
}
```

## Interactive 3D Scenes

### Mouse-Following 3D Objects

```tsx
"use client";
import { useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function MouseFollower() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [target, setTarget] = useState(new THREE.Vector3());
  const { viewport } = useThree();

  useFrame((state) => {
    if (!meshRef.current) return;

    // Convert mouse position to 3D space
    const mouseX = (state.pointer.x * viewport.width) / 2;
    const mouseY = (state.pointer.y * viewport.height) / 2;

    const targetPos = new THREE.Vector3(mouseX, mouseY, 0);

    // Smooth interpolation to target
    meshRef.current.position.lerp(targetPos, 0.1);

    // Subtle rotation based on movement
    meshRef.current.rotation.x = -state.pointer.y * 0.5;
    meshRef.current.rotation.y = state.pointer.x * 0.5;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#ff6b6b"
        wireframe
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function TrailParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array>(new Float32Array(100 * 3));

  useFrame((state) => {
    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position
      .array as Float32Array;

    // Shift positions
    for (let i = positions.length - 1; i >= 3; i--) {
      positions[i] = positions[i - 3];
    }

    // Add new particle at mouse position
    const mouseX = (state.pointer.x * state.viewport.width) / 2;
    const mouseY = (state.pointer.y * state.viewport.height) / 2;

    positions[0] = mouseX;
    positions[1] = mouseY;
    positions[2] = 0;

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={100}
          array={positionsRef.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ff6b6b"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

export default function MouseFollowScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <color attach="background" args={["#0a0a0f"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <MouseFollower />
      <TrailParticles />
    </Canvas>
  );
}
```

### 3D Image Gallery

```tsx
"use client";
import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useCursor, Image } from "@react-three/drei";
import * as THREE from "three";

function GalleryImage({
  url,
  position,
  onSelect,
}: {
  url: string;
  position: [number, number, number];
  onSelect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  useCursor(hovered);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Smooth hover scale
    const targetScale = active ? 1.2 : hovered ? 1.1 : 1;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1,
    );

    // Subtle floating animation
    meshRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => setActive(!active)}
      >
        <planeGeometry args={[3, 2]} />
        <meshBasicMaterial>
          <Image url={url} scale={[3, 2]} transparent opacity={1} />
        </meshBasicMaterial>
      </mesh>

      {/* Frame border */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[3.2, 2.2, 0.05]} />
        <meshStandardMaterial
          color={hovered ? "#ff6b6b" : "#ffffff"}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

function GalleryScene() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const images = [
    { url: "/images/1.jpg", position: [-4, 0, 0] as [number, number, number] },
    { url: "/images/2.jpg", position: [0, 0, 0] as [number, number, number] },
    { url: "/images/3.jpg", position: [4, 0, 0] as [number, number, number] },
  ];

  return (
    <>
      {images.map((image, i) => (
        <GalleryImage
          key={i}
          url={image.url}
          position={image.position}
          onSelect={() => setSelectedImage(selectedImage === i ? null : i)}
        />
      ))}

      {/* Selected image spotlight */}
      {selectedImage !== null && (
        <pointLight
          position={images[selectedImage].position}
          intensity={2}
          distance={5}
          color="#ffffff"
        />
      )}
    </>
  );
}

export default function ImageGalleryScene() {
  return (
    <Canvas camera={{ position: [0, 0, 8] }}>
      <color attach="background" args={["#0a0a0f"]} />
      <ambientLight intensity={0.3} />
      <GalleryScene />
    </Canvas>
  );
}
```

## Performance Optimization

### Object Pooling

```tsx
"use client";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function InstancedParticles({ count = 1000 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
      ),
      scale: Math.random() * 0.5 + 0.5,
    }));
  }, [count]);

  useFrame(() => {
    if (!meshRef.current) return;

    particles.forEach((particle, i) => {
      // Update position
      particle.position.add(particle.velocity);

      // Bounce off boundaries
      if (Math.abs(particle.position.x) > 10) particle.velocity.x *= -1;
      if (Math.abs(particle.position.y) > 10) particle.velocity.y *= -1;
      if (Math.abs(particle.position.z) > 10) particle.velocity.z *= -1;

      // Update instance matrix
      dummy.position.copy(particle.position);
      dummy.scale.setScalar(particle.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#4ecdc4" transparent opacity={0.8} />
    </instancedMesh>
  );
}

export default function InstancedScene() {
  return (
    <Canvas camera={{ position: [0, 0, 15] }}>
      <color attach="background" args={["#0a0a0f"]} />
      <InstancedParticles count={5000} />
    </Canvas>
  );
}
```

### LOD (Level of Detail)

```tsx
"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { LOD } from "@react-three/drei";
import * as THREE from "three";

function LODMesh({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <LOD position={position}>
      {/* High detail - close up */}
      <group level={0}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color="#4ecdc4" />
        </mesh>
      </group>

      {/* Medium detail - mid range */}
      <group level={1}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#4ecdc4" />
        </mesh>
      </group>

      {/* Low detail - far away */}
      <group level={2}>
        <mesh>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#4ecdc4" />
        </mesh>
      </group>
    </LOD>
  );
}

export default function LODScene() {
  return (
    <Canvas camera={{ position: [0, 0, 10] }}>
      <color attach="background" args={["#0a0a0f"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {Array.from({ length: 20 }).map((_, i) => (
        <LODMesh
          key={i}
          position={[
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 10,
          ]}
        />
      ))}
    </Canvas>
  );
}
```

## Loading States

### Suspense with Progress

```tsx
"use client";
import { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Loader, Html } from "@react-three/drei";

function LoadingFallback() {
  return (
    <Html center>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            border: "3px solid #333",
            borderTopColor: "#4ecdc4",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "white" }}>Loading 3D Content...</p>
      </div>
    </Html>
  );
}

function SceneContent() {
  return (
    <>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4ecdc4" />
      </mesh>
    </>
  );
}

export default function LoadingScene() {
  return (
    <>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <color attach="background" args={["#1a1a2e"]} />
        <Suspense fallback={<LoadingFallback />}>
          <SceneContent />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
```

### Progressive Image Loading

```tsx
"use client";
import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, Image } from "@react-three/drei";
import * as THREE from "three";

function ProgressiveImage({ url }: { url: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [loaded, setLoaded] = useState(false);
  const texture = useTexture(url);

  useEffect(() => {
    if (texture) {
      setLoaded(true);
    }
  }, [texture]);

  // Blur effect using custom shader
  const shaderMaterial = useRef<THREE.ShaderMaterial>(null);

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D uTexture;
    uniform float uBlur;
    uniform float uLoaded;
    varying vec2 vUv;
    
    void main() {
      vec4 color = texture2D(uTexture, vUv);
      float blurAmount = uBlur * (1.0 - uLoaded);
      
      // Simple blur effect
      vec4 blurred = vec4(0.0);
      float total = 0.0;
      
      for (float x = -4.0; x <= 4.0; x++) {
        for (float y = -4.0; y <= 4.0; y++) {
          float weight = 1.0 - length(vec2(x, y)) / 5.66;
          blurred += texture2D(uTexture, vUv + vec2(x, y) * blurAmount * 0.01) * weight;
          total += weight;
        }
      }
      
      blurred /= total;
      gl_FragColor = mix(blurred, color, uLoaded);
    }
  `;

  useFrame((state) => {
    if (shaderMaterial.current) {
      shaderMaterial.current.uniforms.uLoaded.value = THREE.MathUtils.lerp(
        shaderMaterial.current.uniforms.uLoaded.value,
        loaded ? 1 : 0,
        0.1,
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[5, 3]} />
      <shaderMaterial
        ref={shaderMaterial}
        uniforms={{
          uTexture: { value: texture },
          uBlur: { value: 5 },
          uLoaded: { value: 0 },
        }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

export default function ProgressiveImageScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <color attach="background" args={["#1a1a2e"]} />
      <ProgressiveImage url="/large-image.jpg" />
    </Canvas>
  );
}
```
