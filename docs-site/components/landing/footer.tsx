"use client";

import Link from "next/link";

export function Footer() {
    return (
        <footer className="w-full py-16 bg-background border-t border-border mt-auto">
            <div className="container mx-auto px-4 md:px-8 max-w-6xl flex flex-col md:flex-row justify-between items-center gap-12">
                <div className="flex flex-col gap-3">
                    <span className="text-2xl font-bold font-mono uppercase tracking-tight">
                        Orchka
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                        Workflow orchestration for modern engineering teams.
                    </p>
                </div>

                <div className="flex gap-10 text-xs font-mono uppercase tracking-widest text-muted-foreground font-medium">
                    <Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
                    <Link href="https://github.com/manyeya/Orchka" className="hover:text-foreground transition-colors">GitHub</Link>
                    <Link href="/" className="hover:text-foreground transition-colors">Privacy</Link>
                </div>

                <div className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">
                    © 2025 ORCHKA_SYS. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
