"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="grid min-h-svh place-items-center p-6 bg-[#0B0F17] text-slate-100">
      <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-400">
          <AlertTriangle className="size-7" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-slate-100">Something went out of sync</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Aether Chat encountered an unexpected state. Your messages remain fully secure.</p>
        <Button className="mt-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold" onClick={reset}>
          <RotateCcw className="mr-2 size-4" />Try again
        </Button>
      </div>
    </main>
  );
}
