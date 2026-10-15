"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ExternalLink, MessageCircleMore } from "lucide-react";
import { isNativePlatform } from "@/lib/platform/Platform.utils";

const subscribeNoop = () => () => {};

export function PublicShellFooter() {
  const isNative = useSyncExternalStore(
    subscribeNoop,
    () => isNativePlatform(),
    () => false
  );

  if (isNative) {
    // In native app shell, omit the marketing footer completely
    return null;
  }

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80" aria-label="Site Footer">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* Branding & Attribution */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <span className="grid size-6 place-items-center rounded-lg bg-indigo-500/20 text-indigo-400">
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
              className="hover:text-indigo-400 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-md py-1 px-1.5 -mx-1.5"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="hover:text-indigo-400 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-md py-1 px-1.5 -mx-1.5"
            >
              Contact
            </Link>
            <Link
              href="/privacy"
              className="hover:text-indigo-400 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-md py-1 px-1.5 -mx-1.5"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-indigo-400 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-md py-1 px-1.5 -mx-1.5"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="hover:text-indigo-400 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-md py-1 px-1.5 -mx-1.5"
            >
              Cookie Policy
            </Link>
            <a
              href="https://github.com/akashdebbarma06/Real-Time-Chat-Application"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-indigo-400 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-md py-1 px-1.5 -mx-1.5"
            >
              <span>GitHub</span>
              <ExternalLink className="size-3" />
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
