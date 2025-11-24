import Link from "next/link";
import { ArrowRight, Terminal, Cpu, Globe } from "lucide-react";

export function Hero() {
    return (
        <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background text-foreground border-b border-border">
            {/* Grid Background */}
            <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

            {/* Floating Abstract Elements */}
            <div className="absolute top-20 left-10 w-32 h-32 border border-primary/20 rounded-full animate-pulse opacity-50 hidden md:block" />
            <div className="absolute bottom-20 right-10 w-48 h-48 border border-primary/20 rounded-full animate-pulse delay-700 opacity-50 hidden md:block" />

            <div className="container relative z-10 flex flex-col items-center text-center px-4 md:px-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/50 backdrop-blur-sm mb-8">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                        System Online v2.0
                    </span>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold tracking-tighter mb-6 uppercase font-mono">
                    Orchka
                    <span className="text-primary block text-2xl md:text-4xl lg:text-5xl mt-2 font-normal tracking-normal normal-case font-sans opacity-80">
                        Automate the Galaxy
                    </span>
                </h1>

                <p className="max-w-2xl leading-normal text-muted-foreground sm:text-xl sm:leading-8 mb-10 font-mono">
                    The brutalist workflow engine for alien franchises. Build, deploy, and scale your intergalactic operations with zero latency.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link
                        href="/dashboard"
                        className="inline-flex h-12 items-center justify-center rounded-none border border-primary bg-primary text-primary-foreground px-8 text-sm font-medium shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 uppercase tracking-widest font-mono"
                    >
                        Initialize
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link
                        href="https://github.com/manyeya/flowbase"
                        target="_blank"
                        className="inline-flex h-12 items-center justify-center rounded-none border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 uppercase tracking-widest font-mono"
                    >
                        <Terminal className="mr-2 h-4 w-4" />
                        Source Code
                    </Link>
                </div>

                {/* Stats / Tech Deco */}
                <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl border-t border-border pt-8">
                    <div className="flex flex-col items-center gap-2">
                        <Cpu className="h-6 w-6 text-muted-foreground" />
                        <span className="text-2xl font-bold font-mono">99.9%</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Uptime</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Globe className="h-6 w-6 text-muted-foreground" />
                        <span className="text-2xl font-bold font-mono">Global</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">CDN</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Terminal className="h-6 w-6 text-muted-foreground" />
                        <span className="text-2xl font-bold font-mono">&lt;10ms</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Latency</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 rounded-full border border-muted-foreground/50 flex items-center justify-center">
                            <div className="h-2 w-2 bg-primary rounded-full" />
                        </div>
                        <span className="text-2xl font-bold font-mono">Secure</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Encryption</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
