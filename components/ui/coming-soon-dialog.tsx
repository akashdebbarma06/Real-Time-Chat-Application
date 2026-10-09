"use client";

import * as React from "react";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export interface ComingSoonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  description?: string;
}

/**
 * A polished "Coming Soon" dialog component.
 *
 * Design goals:
 *  - Gradient glass‑morphism background
 *  - Subtle fade‑in animation
 *  - Dark‑mode aware
 *  - Re‑usable across settings pages
 */
export function ComingSoonDialog({
  open,
  onOpenChange,
  featureName = "This Feature",
  description = "This feature is currently under development and will be available in a future update.",
}: ComingSoonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-card/95 via-card/85 to-primary/5 backdrop-blur-xl rounded-3xl border border-primary/20 shadow-2xl max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          <div className="grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary border border-primary/25 shadow-xl shadow-primary/10">
            <Rocket className="size-8 animate-pulse text-primary" />
          </div>

          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Coming Soon
          </DialogTitle>
          <DialogDescription className="sr-only">
            {featureName} is under development.
          </DialogDescription>
        </DialogHeader>

        <div className="text-center space-y-2 my-2">
          <h3 className="text-base font-semibold text-primary">{featureName}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        </div>

        <DialogFooter className="flex justify-center sm:justify-center mt-4">
          <DialogClose asChild>
            <Button
              variant="default"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto px-8 rounded-2xl font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
            >
              Got it, thanks!
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ComingSoonDialog;

