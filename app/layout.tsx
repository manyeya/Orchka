import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orchka - AI-Powered Workflow Automation",
  description: "Build and automate complex workflows with AI. Streamline your processes, integrate with your favorite tools, and boost productivity with Orchka's intuitive workflow builder.",
  keywords: ["workflow automation", "AI workflows", "process automation", "workflow builder", "business automation"],
  authors: [{ name: "Orchka Team" }],
  creator: "Orchka",
  publisher: "Orchka",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://orchka.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Orchka - AI-Powered Workflow Automation",
    description: "Build and automate complex workflows with AI. Streamline your processes, integrate with your favorite tools, and boost productivity.",
    url: "https://orchka.app",
    siteName: "Orchka",
    images: [
      {
        url: "/orchka-logo.svg",
        width: 1200,
        height: 630,
        alt: "Orchka - AI-Powered Workflow Automation",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orchka - AI-Powered Workflow Automation",
    description: "Build and automate complex workflows with AI. Streamline your processes and boost productivity.",
    images: ["/orchka-logo.svg"],
    creator: "@orchka",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

        <TRPCReactProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </TRPCReactProvider>

      </body>
    </html>
  );
}
