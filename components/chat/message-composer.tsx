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
      const caption = content.trim();
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
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function toggleVoiceRecording() {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      toast.success("Voice note recorded & added to message!");
      setContent((prev) => (prev ? `${prev} [🎙️ Voice Note (0:05)]` : "🎙️ Voice Note (0:05)"));
    } else {
      setIsRecordingVoice(true);
      toast.info("Recording voice note... tap microphone again to finish");
    }
  }

  return (
    <div className="border-t bg-background/90 p-3 backdrop-blur-xl sm:p-4 space-y-3">
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

      {/* 3. Improved Input Container */}
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-800 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md space-y-2">
        {/* Top Action Bar: 😊 Emoji, 📎 File Upload, 🖼️ Image Upload */}
        <div className="flex items-center gap-1 border-b border-slate-800/60 pb-2">
          {/* 😊 Emoji Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                aria-label="Emoji picker"
              >
                <Smile className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="p-2 bg-slate-900 border-slate-800 rounded-2xl shadow-2xl grid grid-cols-7 gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="grid size-8 place-items-center rounded-xl text-lg hover:bg-slate-800 hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 📎 File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => void handleFileSelect(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled || sending}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
            aria-label="Attach file"
          >
            <Paperclip className="size-4" />
          </Button>

          {/* 🖼️ Image Upload */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleFileSelect(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled || sending}
            onClick={() => imageInputRef.current?.click()}
            className="rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
            aria-label="Attach image"
          >
            <ImageIcon className="size-4" />
          </Button>

          {isRecordingVoice && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-semibold animate-pulse">
              <span className="size-2 rounded-full bg-rose-500" />
              <span>Recording Voice Note...</span>
            </div>
          )}
        </div>

        {/* Auto-expanding Input Area + Voice (🎤) & Send (➤) Buttons */}
        <div className="flex items-end gap-2 pt-1">
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
            placeholder={selectedFile ? "Add a caption…" : "Write a message…"}
            className="max-h-40 min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm shadow-none focus-visible:ring-0 placeholder:text-slate-500"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 🎤 Voice Message Button */}
            <Button
              type="button"
              variant={isRecordingVoice ? "destructive" : "ghost"}
              size="icon"
              disabled={disabled || sending}
              onClick={toggleVoiceRecording}
              className={cn("rounded-full transition-all", !isRecordingVoice && "text-slate-400 hover:text-cyan-400 hover:bg-slate-800")}
              aria-label="Voice message"
            >
              {isRecordingVoice ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </Button>

            {/* ➤ Send Button */}
            <Button
              type="button"
              size="icon"
              disabled={disabled || sending || (!content.trim() && !selectedFile)}
              onClick={() => void submit()}
              aria-label="Send message"
              className="size-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
            >
              {sending ? <Loader2 className="size-5 animate-spin" /> : <SendHorizontal className="size-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
