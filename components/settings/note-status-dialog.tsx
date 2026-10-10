"use client";

import { useState } from "react";
import { Clock, MessageSquareQuote, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useBackHandler } from "@/hooks/use-back-handler";

interface NoteStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNote: string;
  onSaveNote: (note: string) => void;
  onDeleteNote: () => void;
}

const PRESET_NOTES = [
  "Can't talk, AetherChat only",
  "At work 💼",
  "In a meeting 📞",
  "Available to chat 👋",
  "Traveling ✈️",
  "Focus mode 🎧",
];

export function NoteStatusDialog({
  open,
  onOpenChange,
  currentNote,
  onSaveNote,
  onDeleteNote,
}: NoteStatusDialogProps) {
  const [noteText, setNoteText] = useState(currentNote);

  // Priority 1: 24h Note Status Dialog
  useBackHandler({
    id: "note-status-dialog",
    priority: 100,
    enabled: open,
    onBack: () => onOpenChange(false),
  });

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setNoteText(currentNote);
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNote(noteText.trim().slice(0, 60));
    onOpenChange(false);
  };

  const handleClear = () => {
    onDeleteNote();
    setNoteText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border border-border/80 shadow-2xl">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <MessageSquareQuote className="size-4" />
            <span>24-Hour Note Status</span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Share a Note
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
            <Clock className="size-3.5 shrink-0 text-primary" />
            <span>Visible to contacts for 24 hours · Max 60 characters</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Note Input */}
          <div className="space-y-1.5">
            <div className="relative">
              <Input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value.slice(0, 60))}
                placeholder="Can't talk, AetherChat only"
                maxLength={60}
                autoFocus
                className="rounded-2xl bg-muted/60 border-border pr-14 text-sm font-medium h-11 focus-visible:ring-1 focus-visible:ring-primary"
              />
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-medium ${noteText.length >= 55 ? "text-amber-500 font-bold" : "text-muted-foreground"
                  }`}
              >
                {noteText.length}/60
              </span>
            </div>
          </div>

          {/* Preset Suggestions */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
              <Sparkles className="size-3 text-primary" />
              <span>Quick Suggestions</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_NOTES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNoteText(preset)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${noteText === preset
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "bg-muted/50 border-border/70 text-foreground hover:bg-muted"
                    }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            {currentNote ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl gap-1.5 h-9"
              >
                <Trash2 className="size-3.5" />
                <span>Remove Note</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-semibold px-4 h-9 shadow-xs"
              >
                Save Note
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
