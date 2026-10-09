import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircleMore, Mail, Shield, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const metadata: Metadata = {
  title: {
    template: "%s · Aether Help",
    default: "Help & Feedback · Aether Chat",
  },
  description: "In-app support, frequently asked questions, contact options, and privacy controls.",
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col">
      {/* Top sticky in-app navigation bar */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon-sm" className="rounded-xl">
              <Link href="/chat" aria-label="Back to chat">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <MessageCircleMore className="size-5" />
            </span>
            <div className="flex items-center gap-2">
              <Link href="/chat" className="font-bold text-lg tracking-wider uppercase bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent hover:opacity-85 transition">
                Aether Chat
              </Link>
              <span className="hidden sm:inline-block text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                Help & Feedback
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 hidden md:flex">
              <Link href="/help">
                <BookOpen className="size-3.5 text-primary" />
                <span>FAQs</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 hidden md:flex">
              <Link href="/help/contact">
                <Mail className="size-3.5 text-primary" />
                <span>Contact Us</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 hidden md:flex">
              <Link href="/help/privacy">
                <Shield className="size-3.5 text-primary" />
                <span>Privacy</span>
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile sub-tabs */}
        <div className="flex md:hidden border-t border-border/60 bg-muted/30 px-4 py-2 gap-2 overflow-x-auto text-xs font-semibold">
          <Link href="/help" className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground hover:bg-accent transition shrink-0 flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-primary" />
            <span>FAQs</span>
          </Link>
          <Link href="/help/contact" className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground hover:bg-accent transition shrink-0 flex items-center gap-1.5">
            <Mail className="size-3.5 text-primary" />
            <span>Contact Us</span>
          </Link>
          <Link href="/help/privacy" className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground hover:bg-accent transition shrink-0 flex items-center gap-1.5">
            <Shield className="size-3.5 text-primary" />
            <span>Privacy</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {children}
      </main>
    </div>
  );
}
