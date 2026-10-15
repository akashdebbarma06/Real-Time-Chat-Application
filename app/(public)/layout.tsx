import Link from "next/link";
import { MessageCircleMore, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-[#0B0F17] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header Landmark */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0B0F17]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo / Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight rounded-xl focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            aria-label="Aether Chat Homepage"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
              <MessageCircleMore className="size-5" />
            </span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent uppercase tracking-wider font-extrabold text-sm sm:text-base">
              Aether Chat
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 sm:gap-3" aria-label="Main Navigation">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Link href="/about">About</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Link href="/contact">Contact</Link>
            </Button>

            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" aria-hidden="true" />

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Link href="/login">Sign In</Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 text-xs sm:text-sm px-3.5 sm:px-4 focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Landmark */}
      <main id="main-content" className="flex-1 focus:outline-none">
        {children}
      </main>

      {/* Footer Landmark */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80" aria-label="Site Footer">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            {/* Branding & Attribution */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <span className="grid size-6 place-items-center rounded-lg bg-cyan-500/20 text-cyan-400">
                  <MessageCircleMore className="size-3.5" />
                </span>
                <span>Aether Chat</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Open-source real-time messaging engine engineered with Next.js, Supabase, and Capacitor.
              </p>
              <p className="text-[11px] text-slate-500">
                © {new Date().getFullYear()} Akash Debbarma. MIT Licensed.
              </p>
            </div>

            {/* Public Links Navigation */}
            <nav
              className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-slate-400 font-medium"
              aria-label="Footer Navigation"
            >
              <Link
                href="/about"
                className="hover:text-cyan-400 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md py-1 px-1.5 -mx-1.5"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="hover:text-cyan-400 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md py-1 px-1.5 -mx-1.5"
              >
                Contact
              </Link>
              <Link
                href="/privacy"
                className="hover:text-cyan-400 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md py-1 px-1.5 -mx-1.5"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-cyan-400 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md py-1 px-1.5 -mx-1.5"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="hover:text-cyan-400 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md py-1 px-1.5 -mx-1.5"
              >
                Cookie Policy
              </Link>
              <a
                href="https://github.com/akashdebbarma06/Real-Time-Chat-Application"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-cyan-400 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md py-1 px-1.5 -mx-1.5"
              >
                <span>GitHub</span>
                <ExternalLink className="size-3" />
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
