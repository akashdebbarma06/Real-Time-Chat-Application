"use client";

import { useEffect, useState } from "react";
import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], action: "Focus Search" },
  { keys: ["Ctrl", "N"], action: "New Chat" },
  { keys: ["Ctrl", "Shift", "M"], action: "Toggle Mute" },
  { keys: ["Esc"], action: "Close panels / Clear search" },
  { keys: ["Ctrl", "/"], action: "Show Keyboard Shortcuts" },
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl + / or Cmd + /
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-6 rounded-3xl shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-2">
            <Keyboard className="size-5 text-primary" />
            <DialogTitle className="text-base font-bold">Keyboard Shortcuts</DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-2.5">
          {SHORTCUTS.map((sc, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border bg-muted/40 p-3">
              <span className="text-xs font-medium text-foreground">{sc.action}</span>
              <div className="flex items-center gap-1">
                {sc.keys.map((k, ki) => (
                  <kbd
                    key={ki}
                    className="rounded-md border bg-card px-2 py-1 text-[10px] font-mono font-semibold text-primary shadow-xs"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
