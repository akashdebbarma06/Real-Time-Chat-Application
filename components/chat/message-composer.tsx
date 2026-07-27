"use client";

import { useRef, useState } from "react";
import { Loader2, Paperclip, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 6 * 1024 * 1024;

interface MessageComposerProps {
  disabled?: boolean;
  sending: boolean;
  onSendText: (content: string) => Promise<void>;
  onSendFile: (file: File, caption: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
}

export function MessageComposer({ disabled, sending, onSendText, onSendFile, onTyping }: MessageComposerProps) {
  const [content, setContent] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function submit() {
    const trimmed = content.trim();
    if (!trimmed || sending || disabled) return;
    setContent("");
    onTyping(false);
    await onSendText(trimmed);
  }

  async function handleFile(file?: File) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Files must be 6 MB or smaller");
      return;
    }
    const caption = content.trim();
    setContent("");
    onTyping(false);
    await onSendFile(file, caption);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div className="border-t bg-background/90 p-3 backdrop-blur-xl sm:p-4">
      <div className={cn("mx-auto flex max-w-6xl items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring", disabled && "opacity-60")}>
        <input ref={fileInput} type="file" className="hidden" onChange={(event) => void handleFile(event.target.files?.[0])} />
        <Button type="button" variant="ghost" size="icon" disabled={disabled || sending} onClick={() => fileInput.current?.click()} aria-label="Attach a file"><Paperclip /></Button>
        <Textarea
          value={content}
          disabled={disabled || sending}
          onChange={(event) => { setContent(event.target.value); onTyping(Boolean(event.target.value.trim())); }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          rows={1}
          placeholder="Write a message…"
          className="max-h-36 min-h-10 resize-none border-0 bg-transparent px-1 py-2.5 shadow-none focus-visible:ring-0"
        />
        <Button type="button" size="icon" disabled={disabled || sending || !content.trim()} onClick={() => void submit()} aria-label="Send message">{sending ? <Loader2 className="animate-spin" /> : <SendHorizontal />}</Button>
      </div>
      <p className="mx-auto mt-2 max-w-6xl px-2 text-[10px] text-muted-foreground">Enter to send · Shift + Enter for a new line · Attachments up to 6 MB</p>
    </div>
  );
}
