import Link from "next/link";
import { MessageCircleMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadCapsuleButton } from "@/components/layout/download-capsule-button";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-[#0B0F17] text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0B0F17]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
              <MessageCircleMore className="size-5" />
            </span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent uppercase tracking-wider">
              Aether Chat
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
              <Link href="/about">About</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
              <Link href="/contact">Contact</Link>
            </Button>

            {/* Highlighted Capsule Download Box (Web Only) */}
            <DownloadCapsuleButton />

            <Button asChild size="sm" className="rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20">
              <Link href="/login">Launch App</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <MessageCircleMore className="size-4 text-cyan-400" />
              <span>© {new Date().getFullYear()} Aether Chat. All rights reserved.</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
              <Link href="/about" className="hover:text-cyan-400 transition-colors">
                About
              </Link>
              <Link href="/contact" className="hover:text-cyan-400 transition-colors">
                Contact
              </Link>
              <Link href="/privacy" className="hover:text-cyan-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-cyan-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="hover:text-cyan-400 transition-colors">
                Cookie Policy
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
