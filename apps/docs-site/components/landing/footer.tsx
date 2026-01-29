"use client";

import Link from "next/link";
import { Github, Twitter, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-12 border-t border-[var(--border)] bg-[var(--background)]">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold font-mono tracking-tighter uppercase mb-4">
              Orchka
            </h3>
            <p className="text-[var(--muted-foreground)] max-w-sm leading-relaxed">
              Workflow orchestration reimagined. Build intelligent automations with
              visual workflows, AI agents, and durable execution.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/docs"
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/components/nodes"
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Node Reference
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/guides"
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Guides
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider mb-4">Community</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/manyeya/Orchka"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/manyeya/Orchka/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Issues
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/manyeya/Orchka/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  License
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-mono text-[var(--muted-foreground)]">
            © {currentYear} Orchka. Open source, forever.
          </p>
          <p className="text-xs font-mono text-[var(--muted-foreground)] flex items-center gap-2">
            Made with <Heart className="w-3 h-3 text-[var(--primary)]" /> by the community
          </p>
        </div>
      </div>
    </footer>
  );
}
