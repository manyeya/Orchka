"use client";

import Link from "next/link";

export function Footer() {
    return (
        <footer className="w-full py-12 bg-background border-t border-border mt-auto">
            <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex flex-col gap-2">
                    <span className="text-xl font-bold font-mono uppercase tracking-tighter">
                        Orchka
                    </span>
                    <p className="text-sm text-muted-foreground">
                        The brutalist workflow engine.
                    </p>
                </div>

                <div className="flex gap-8 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
                    <Link href="https://github.com/manyeya/Orchka" className="hover:text-primary transition-colors">GitHub</Link>
                    <Link href="/" className="hover:text-primary transition-colors">Privacy</Link>
                </div>

                <div className="text-[10px] font-mono text-muted-foreground/50">
                    © 2024 ORCHKA_SYS. ALL RIGHTS RESERVED.
                </div>
            </div>
        </footer>
    );
}
