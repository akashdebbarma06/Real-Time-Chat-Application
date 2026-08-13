"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  CornerUpLeft,
  FileIcon,
  ImageIcon,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  SendHorizontal,
  Smile,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ComingSoonDialog } from "@/components/ui/coming-soon-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatFileSize } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

const MAX_FILE_SIZE = 6 * 1024 * 1024;
const QUICK_EMOJIS = ["😊", "👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "🚀", "💡", "✨", "🙏", "👀", "💬"];

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
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertEmoji(emoji: string) {
    setContent((prev) => prev + emoji);
    onTyping(true);
    textareaRef.current?.focus();
  }

  async function submit() {
    if (sending || disabled) return;

    if (selectedFile) {
      const caption = content.trim().slice(0, 2000);
      setSelectedFile(null);
      setPreviewUrl(null);
      setContent("");
      onTyping(false);
      await onSendFile(selectedFile, caption);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      toast.error("Message content exceeds 2,000 characters limit");
      return;
    }
    setContent("");
    onTyping(false);
    await onSendText(trimmed);
  }

  function handleFileSelect(file?: File) {
    if (!file) return;
    const forbiddenExts = [".exe", ".bat", ".cmd", ".sh", ".msi", ".vbs", ".ps1"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (forbiddenExts.includes(ext)) {
      toast.error("Executable files are not permitted for security");
      return;
    }
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
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  function toggleVoiceRecording() {
    setComingSoonOpen(true);
  }

  return (
    <div className="border-t bg-background p-3 sm:p-4 space-y-3">
      {/* 1. Reply Banner Preview */}
      {replyToMessage && (
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-2.5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <CornerUpLeft className="size-4 text-primary shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-primary">Replying to {replyToMessage.sender.display_name}</span>
              <p className="truncate text-muted-foreground">{replyToMessage.content || "Attachment"}</p>
            </div>
          </div>
          <Button size="icon-sm" variant="ghost" onClick={onCancelReply} className="size-6 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* 2. File Attachment Preview Card */}
      {selectedFile && (
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border bg-muted/50 p-2.5 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            {previewUrl ? (
              <div className="relative size-12 overflow-hidden rounded-xl border shrink-0">
                <Image src={previewUrl} alt="Preview" fill unoptimized className="object-cover" />
              </div>
            ) : (
              <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <FileIcon className="size-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{selectedFile.name}</p>
              <p className="text-[10px] text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <Button size="icon-sm" variant="ghost" onClick={clearSelectedFile} className="text-muted-foreground hover:text-destructive">
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* 3. Capsule Input Container (Figma pill style) */}
      <div className="mx-auto max-w-6xl flex items-end gap-2">
        {/* Input Capsule */}
        <div className="flex-1 flex items-end rounded-full border bg-muted/30 px-4 py-1.5 shadow-sm">
          <Textarea
            ref={textareaRef}
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
            placeholder={selectedFile ? "Add a caption…" : "Message..."}
            className="max-h-32 min-h-9 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
          />

          {/* Right-side action icons inside the capsule */}
          <div className="flex items-center gap-0.5 shrink-0 pb-1.5">
            {/* Mic */}
            <button
              type="button"
              disabled={disabled || sending}
              onClick={toggleVoiceRecording}
              className={cn(
                "grid size-8 place-items-center rounded-full transition-all text-muted-foreground hover:text-foreground hover:bg-muted",
                isRecordingVoice && "text-destructive"
              )}
              aria-label="Voice message"
            >
              {isRecordingVoice ? <MicOff className="size-[18px]" /> : <Mic className="size-[18px]" />}
            </button>

            {/* Emoji Picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  aria-label="Emoji picker"
                >
                  <Smile className="size-[18px]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="p-2 rounded-2xl shadow-2xl grid grid-cols-7 gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="grid size-8 place-items-center rounded-xl text-lg hover:bg-muted hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Image Attach */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleFileSelect(e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={disabled || sending}
              onClick={() => imageInputRef.current?.click()}
              className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              aria-label="Attach image"
            >
              <ImageIcon className="size-[18px]" />
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => void handleFileSelect(e.target.files?.[0])}
        />

        {/* Send Button (circle) */}
        {(content.trim() || selectedFile) && (
          <Button
            type="button"
            size="icon"
            disabled={disabled || sending || (!content.trim() && !selectedFile)}
            onClick={() => void submit()}
            aria-label="Send message"
            className="size-10 shrink-0 rounded-full bg-foreground hover:bg-foreground/90 text-background font-bold shadow-sm"
          >
            {sending ? <Loader2 className="size-5 animate-spin" /> : <SendHorizontal className="size-5" />}
          </Button>
        )}
      </div>

      {isRecordingVoice && (
        <div className="mx-auto max-w-6xl flex items-center gap-2 px-4 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold animate-pulse">
          <span className="size-2 rounded-full bg-destructive" />
          <span>Recording Voice Note...</span>
        </div>
      )}

      <ComingSoonDialog
        open={comingSoonOpen}
        onOpenChange={setComingSoonOpen}
        featureName="Voice Messages & Audio Recording"
      />
    </div>
  );
}
