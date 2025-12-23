import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { WorkflowPreview } from '@/components/landing/workflow-preview';
import { Footer } from '@/components/landing/footer';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Hero />
      <Features />
      <WorkflowPreview />
      <Footer />
    </main>
  );
}
