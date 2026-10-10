"use client";

import { Keyboard, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const shortcutGroups = [
    {
      title: "Navigation",
      items: [
        { label: "New conversation", keys: ["Ctrl", "N"] },
        { label: "Search chats / messages", keys: ["Ctrl", "F"] },
        { label: "Previous conversation", keys: ["Ctrl", "Shift", "["] },
        { label: "Next conversation", keys: ["Ctrl", "Shift", "]"] },
        { label: "Open user profile", keys: ["Ctrl", "Shift", "P"] },
      ],
    },
    {
      title: "Chat & Messaging",
      items: [
        { label: "Send message", keys: ["Enter"] },
        { label: "New line", keys: ["Shift", "Enter"] },
        { label: "Open emoji picker", keys: ["Ctrl", "E"] },
        { label: "Open attachment menu", keys: ["Ctrl", "Shift", "A"] },
        { label: "Close modal / active panel", keys: ["Esc"] },
      ],
    },
    {
      title: "Controls & Actions",
      items: [
        { label: "Mute conversation", keys: ["Ctrl", "Shift", "M"] },
        { label: "Mark as unread", keys: ["Ctrl", "Shift", "U"] },
        { label: "Archive conversation", keys: ["Ctrl", "Shift", "D"] },
        { label: "Show shortcuts cheat sheet", keys: ["Ctrl", "/"] },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-full p-0 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-border bg-background text-foreground max-h-[85vh]">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Keyboard className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">
                Keyboard Shortcuts
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Desktop productivity hotkeys
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Shortcuts Content */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                {group.title}
              </p>
              <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-2.5 px-3"
                  >
                    <span className="text-xs text-foreground font-medium">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-0.5 rounded-md bg-muted border border-border/80 text-[10px] font-mono font-medium text-muted-foreground shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
