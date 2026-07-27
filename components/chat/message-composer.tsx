"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { CornerUpLeft, FileIcon, Loader2, Paperclip, SendHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFileSize } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

const MAX_FILE_SIZE = 6 * 1024 * 1024;

interface MessageComposerProps {
  disabled?: boolean;
  sending: boolean;
  replyToMessage?: ChatMessage | null;
  onCancelReply?: () => void;
  onSendText: (content: string) => Promise<void>;
  onSendFile: (file: File, caption: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
}

export function MessageComposer({
  disabled,
  sending,
  replyToMessage,
  onCancelReply,
  onSendText,
  onSendFile,
  onTyping,
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function submit() {
    if (sending || disabled) return;

    if (selectedFile) {
      const caption = content.trim();
      setSelectedFile(null);
      setPreviewUrl(null);
      setContent("");
      onTyping(false);
      await onSendFile(selectedFile, caption);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) return;
    setContent("");
    onTyping(false);
    await onSendText(trimmed);
  }

  function handleFileSelect(file?: File) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Files must be 6 MB or smaller");
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div className="border-t bg-background/90 p-3 backdrop-blur-xl sm:p-4 space-y-2">
      {/* 1. Reply Banner Preview */}
      {replyToMessage && (
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2.5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <CornerUpLeft className="size-4 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-cyan-400">Replying to {replyToMessage.sender.display_name}</span>
              <p className="truncate text-slate-300">{replyToMessage.content || "Attachment"}</p>
            </div>
          </div>
          <Button size="icon-sm" variant="ghost" onClick={onCancelReply} className="size-6 text-slate-400 hover:text-white">
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* 2. File Attachment Preview Card */}
      {selectedFile && (
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-2.5 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            {previewUrl ? (
              <div className="relative size-12 overflow-hidden rounded-xl border border-slate-700 shrink-0">
                <Image src={previewUrl} alt="Preview" fill unoptimized className="object-cover" />
              </div>
            ) : (
              <div className="grid size-12 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                <FileIcon className="size-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-100">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-400">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <Button size="icon-sm" variant="ghost" onClick={clearSelectedFile} className="text-slate-400 hover:text-rose-400">
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* 3. Composer Controls */}
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring",
          disabled && "opacity-60"
        )}
      >
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(event) => void handleFileSelect(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || sending}
          onClick={() => fileInput.current?.click()}
          aria-label="Attach a file"
        >
          <Paperclip />
        </Button>

        <Textarea
          value={content}
          disabled={disabled || sending}
          onChange={(event) => {
            setContent(event.target.value);
            onTyping(Boolean(event.target.value.trim()));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          rows={1}
          placeholder={selectedFile ? "Add a caption…" : "Write a message…"}
          className="max-h-36 min-h-10 resize-none border-0 bg-transparent px-1 py-2.5 shadow-none focus-visible:ring-0 text-sm"
        />

        <Button
          type="button"
          size="icon"
          disabled={disabled || sending || (!content.trim() && !selectedFile)}
          onClick={() => void submit()}
          aria-label="Send message"
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
        >
          {sending ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
        </Button>
      </div>

      <p className="mx-auto mt-1 max-w-6xl px-2 text-[10px] text-muted-foreground">
        Enter to send · Shift + Enter for a new line · Attachments up to 6 MB
      </p>
    </div>
  );
}
