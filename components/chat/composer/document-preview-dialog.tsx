"use client";

import { useState } from "react";
import { FileText, Loader2, SendHorizontal, X } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";

interface DocumentPreviewDialogProps {
  open: boolean;
  file: File | null;
  onClose: () => void;
  onSend: (file: File, caption: string) => Promise<void>;
}

export function DocumentPreviewDialog({
  open,
  file,
  onClose,
  onSend,
}: DocumentPreviewDialogProps) {
  const [caption, setCaption] = useState("");
  const [sending, setSending] = useState(false);

  if (!open || !file) return null;

  // Extract file extension and size in MB
  const extensionMatch = file.name.match(/\.([0-9a-zA-Z]+)$/);
  const extension = extensionMatch ? extensionMatch[1].toUpperCase() : "FILE";
  const sizeInMB = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

  async function handleSend() {
    if (sending || !file) return;
    setSending(true);
    try {
      await onSend(file, caption);
      setCaption("");
      onClose();
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Document Preview"
      className="fixed inset-0 z-50 md:absolute md:inset-0 md:z-30 flex flex-col bg-background/95 text-foreground backdrop-blur-md animate-in fade-in duration-200 select-none overflow-hidden"
    >
      {/* ── 1. Top Header: Close Button and File Name ── */}
      <header className="relative z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/90 px-4">
        <button
          type="button"
          onClick={onClose}
          title="Close"
          aria-label="Close"
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>
        <h2 className="truncate text-base font-medium text-foreground">
          {file.name}
        </h2>
      </header>

      {/* ── 2. Center Area: Dark container with generic file icon, "No preview available", & metadata ── */}
      <main className="relative flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-2xl animate-in zoom-in-95 duration-150">
          {/* Generic File Icon Container */}
          <div className="relative mb-5 flex size-24 items-center justify-center rounded-2xl bg-muted border border-border text-muted-foreground shadow-inner">
            <FileText className="size-12 stroke-[1.5] text-muted-foreground" />
            <span className="absolute bottom-2 right-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground tracking-wider">
              {extension}
            </span>
          </div>

          {/* "No preview available" heading */}
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            No preview available
          </h3>

          {/* Metadata: size in MB and file extension */}
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span>{sizeInMB}</span>
            <span>•</span>
            <span className="font-medium text-foreground">{extension} file</span>
          </p>
        </div>
      </main>

      {/* ── 3. Bottom Area: Caption input, file extension thumbnail badge, and send button ── */}
      <footer className="relative z-10 flex flex-col gap-3 border-t border-border bg-card/95 px-4 pt-3 pb-4">
        {/* Caption Input */}
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-full bg-muted/50 px-4 py-2 border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40 transition-all">
          <input
            type="text"
            value={caption}
            placeholder="Type a message"
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        {/* Thumbnail badge and circular Emerald send button */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* File extension thumbnail badge */}
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/60 px-3 py-2 max-w-xs truncate">
            <div className="flex size-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
              <FileText className="size-4.5" />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="truncate text-xs font-semibold text-foreground">
                {file.name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {extension} • {formatFileSize(file.size)}
              </span>
            </div>
          </div>

          {/* Circular Send Button */}
          <button
            type="button"
            disabled={sending}
            onClick={() => void handleSend()}
            title="Send document"
            aria-label="Send document"
            className="flex size-13 shrink-0 items-center justify-center rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {sending ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <SendHorizontal className="size-6" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
