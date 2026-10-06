"use client";

import { Rocket } from "lucide-react";
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
      <DialogContent className="sm:max-w-md p-6 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          <div className="grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary border border-primary/25 shadow-xl shadow-primary/10">
            <Rocket className="size-8 animate-pulse" />
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span>🚀 Coming Soon</span>
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-2 my-2">
          <h3 className="text-sm font-semibold text-primary">{featureName}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-8 rounded-2xl font-bold shadow-lg shadow-primary/20"
          >
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
