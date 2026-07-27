"use client";

import { Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ComingSoonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  description?: string;
}

export function ComingSoonDialog({
  open,
  onOpenChange,
  featureName = "This Feature",
  description = "This feature is currently under development and will be available in a future update.",
}: ComingSoonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 p-6 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          <div className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-xl shadow-cyan-500/10">
            <Rocket className="size-8 animate-pulse" />
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>🚀 Coming Soon</span>
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-3 my-2">
          <h3 className="text-sm font-semibold text-cyan-400">{featureName}</h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-8 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
          >
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
