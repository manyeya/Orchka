import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Home - Orchka",
  description: "Welcome to Orchka - your AI-powered workflow automation platform. Build, manage, and automate complex workflows effortlessly.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Home() {
  return (
    <p>Orchka</p>
  )
}
