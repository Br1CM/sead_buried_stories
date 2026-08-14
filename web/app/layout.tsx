import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

const THEME_INIT_SCRIPT = `
  (function () {
    try {
      var stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") {
        document.documentElement.setAttribute("data-theme", stored);
      }
    } catch (e) {}
  })();
`;

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <header className="border-b border-ink-10">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
            <Link href="/" className="mr-auto flex items-center gap-2.5">
              <span className="font-semibold tracking-tight text-lg">Buried Stories</span>
              <span className="h-4 w-px bg-ink-15" aria-hidden />
              <Image src="/sead-logo.png" alt="SEAD" width={73} height={24} className="opacity-80" />
            </Link>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-70">
              <Link href="/species" className="whitespace-nowrap hover:text-foreground transition-colors">
                Species Path
              </Link>
              <Link href="/ceramics" className="whitespace-nowrap hover:text-foreground transition-colors">
                Ceramics
              </Link>
              <Link href="/climate" className="whitespace-nowrap hover:text-foreground transition-colors">
                Thermometer
              </Link>
              <Link href="/sites" className="whitespace-nowrap hover:text-foreground transition-colors">
                Dig One Spot
              </Link>
              <Link href="/timber" className="whitespace-nowrap hover:text-foreground transition-colors">
                Timber Tales
              </Link>
              <ThemeToggle />
            </div>
          </nav>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="flex flex-col items-center gap-3 border-t border-ink-10 px-6 py-6 text-center text-xs text-ink-40">
          <a href="https://www.sead.se" target="_blank" rel="noopener noreferrer">
            <Image src="/sead-logo.png" alt="SEAD" width={109} height={36} className="opacity-70 transition-opacity hover:opacity-100" />
          </a>
          <span>
            Built on data from the{" "}
            <a
              href="https://www.sead.se"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-ink-70"
            >
              Strategic Environmental Archaeology Database (SEAD)
            </a>
          </span>
        </footer>
      </body>
    </html>
  );
}
