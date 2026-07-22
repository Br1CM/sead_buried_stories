import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Buried Stories | SEAD",
  description:
    "Playful, story-driven journeys through thousands of years of environmental and archaeological data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <header className="border-b border-white/10">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
            <Link href="/" className="font-semibold tracking-tight text-lg mr-auto">
              Buried Stories
            </Link>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/70">
              <Link href="/species" className="whitespace-nowrap hover:text-white transition-colors">
                Species Path
              </Link>
              <Link href="/ceramics" className="whitespace-nowrap hover:text-white transition-colors">
                Ceramics
              </Link>
              <Link href="/climate" className="whitespace-nowrap hover:text-white transition-colors">
                Thermometer
              </Link>
              <Link href="/sites" className="whitespace-nowrap hover:text-white transition-colors">
                Dig One Spot
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/40">
          Built on data from the{" "}
          <a
            href="https://www.sead.se"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/70"
          >
            Strategic Environmental Archaeology Database (SEAD)
          </a>
        </footer>
      </body>
    </html>
  );
}
