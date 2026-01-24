import { Hero } from "@/components/landing/hero";
import { Marquee } from "@/components/landing/marquee";
import { Features } from "@/components/landing/features";
import { WorkflowShowcase } from "@/components/landing/workflow-showcase";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { CursorFollower } from "@/components/ui/cursor-follower";

export default function HomePage() {
  return (
    <SmoothScroll>
      <CursorFollower />
      <main className="flex min-h-screen flex-col items-center bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)]">
        <Hero />
        <Marquee />
        <Features />
        <WorkflowShowcase />
        <CTA />
        <Footer />
      </main>
    </SmoothScroll>
  );
}
