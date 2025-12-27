import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { WorkflowPreview } from '@/components/landing/workflow-preview';
import { Footer } from '@/components/landing/footer';
import { SmoothScroll } from '@/components/smooth-scroll';

export default function HomePage() {
  return (
    <SmoothScroll>
    <main className="flex min-h-screen flex-col items-center bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Hero />
      <Features />
      <WorkflowPreview />
      <Footer />
    </main>
    </SmoothScroll>
  );
}
