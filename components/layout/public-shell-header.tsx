"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, MessageCircleMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isNativePlatform } from "@/lib/platform/Platform.utils";

const subscribeNoop = () => () => {};

export function PublicShellHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const isNative = useSyncExternalStore(
    subscribeNoop,
    () => isNativePlatform(),
    () => false
  );

  const titleMap: Record<string, string> = {
    "/about": "About AetherChat",
    "/privacy": "Privacy Policy",
    "/terms": "Terms of Service",
    "/cookies": "Cookie & Storage Policy",
    "/contact": "Contact Support",
  };

  const title = titleMap[pathname] || "AetherChat";

  if (isNative) {
    // Native mobile app shell top-bar: clean back arrow, bold title, zero marketing links
    return (
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/chat");
                }
              }}
              className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-base font-bold text-foreground tracking-tight">{title}</h1>
          </div>
        </div>
      </header>
    );
  }

  // Desktop web browser header
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0F1115]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo / Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
          aria-label="Aether Chat Homepage"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20">
            <MessageCircleMore className="size-5" />
          </span>
          <span className="bg-gradient-to-r from-indigo-400 to-violet-300 bg-clip-text text-transparent uppercase tracking-wider font-extrabold text-sm sm:text-base">
            Aether Chat
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1.5 sm:gap-3" aria-label="Main Navigation">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Link href="/about">About</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Link href="/contact">Contact</Link>
          </Button>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" aria-hidden="true" />

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Link href="/login">Sign In</Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20 text-xs sm:text-sm px-3.5 sm:px-4 focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
