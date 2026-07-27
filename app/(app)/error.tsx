"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="grid min-h-svh place-items-center p-6"><div className="max-w-md rounded-3xl border bg-card p-8 text-center shadow-xl"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive"><AlertTriangle /></div><h1 className="mt-5 text-xl font-semibold">Something went out of orbit</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">ChatSphere hit an unexpected error. Your messages are still safe.</p><Button className="mt-6" onClick={reset}><RotateCcw />Try again</Button></div></main>;
}
