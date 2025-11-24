import Link from "next/link";
import { Github, Twitter, Disc } from "lucide-react";

export function Footer() {
    return (
        <footer className="w-full border-t border-border bg-background py-12 md:py-24 lg:py-32">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="flex flex-col gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-xl font-bold font-mono uppercase tracking-tighter">Orchka</span>
                        </Link>
                        <p className="text-sm text-muted-foreground font-mono">
                            The last workflow engine you'll ever need. Built for the void.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h3 className="font-bold uppercase tracking-wider font-mono mb-2">Product</h3>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Changelog</Link>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h3 className="font-bold uppercase tracking-wider font-mono mb-2">Resources</h3>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">API Reference</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Community</Link>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h3 className="font-bold uppercase tracking-wider font-mono mb-2">Connect</h3>
                        <div className="flex gap-4">
                            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Github className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Twitter className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Disc className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground font-mono">
                        © {new Date().getFullYear()} Orchka Inc. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono">Privacy Policy</Link>
                        <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
