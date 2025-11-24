import { Hero } from "../features/landing-page/hero";
import { Features } from "../features/landing-page/features";
import { WorkflowPreview } from "../features/landing-page/workflow-preview";
import { Footer } from "../features/landing-page/footer";
import { SmoothScroll } from "../components/smooth-scroll";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <SmoothScroll>
        <Hero />
        <Features />
        <WorkflowPreview />
        <Footer />
      </SmoothScroll>
    </main>
  );
}
