"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 text-center bg-slate-950 text-slate-100">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-6">
        <AlertCircle className="size-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400 leading-relaxed">
        An unexpected error occurred while loading this page. Our monitoring system has logged this incident.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Button onClick={reset} variant="default" className="bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 rounded-full gap-2">
          <RefreshCw className="size-4" />
          Try again
        </Button>
        <Button asChild variant="outline" className="rounded-full border-slate-800 text-slate-300 hover:bg-slate-900">
          <Link href="/chat">Return to Chat</Link>
        </Button>
      </div>
    </div>
  );
}
