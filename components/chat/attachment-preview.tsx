"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, FileText, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatFileSize, formatMessageTime } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { VoiceNotePlayer } from "@/components/chat/media/voice-note-player";
import { VideoPlayerCard } from "@/components/chat/media/video-player-card";
import { VideoNoteBubble } from "@/components/chat/media/video-note-bubble";
import { ImageMediaCard } from "@/components/chat/media/image-media-card";

interface AttachmentPreviewProps {
  message: ChatMessage;
  own?: boolean;
  onForward?: (message: ChatMessage) => void;
}

export function AttachmentPreview({
  message,
  own = false,
  onForward,
}: AttachmentPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!message.attachment_path) return;
    let active = true;
    void createClient()
      .storage.from("chat-files")
      .createSignedUrl(message.attachment_path, 3600)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl || null);
      });
    return () => {
      active = false;
    };
  }, [message.attachment_path]);

  if (!url) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Preparing attachment…
      </div>
    );
  }

  const fileName = message.attachment_name || "";
  const msgType = (message as { type?: string }).type;
  const msgMessageType = (message as { message_type?: string }).message_type;
  const contentLower = message.content?.toLowerCase() || "";

  const formattedTime = formatMessageTime(message.created_at);
  const readBySomeoneElse = message.read_receipts?.some((r) => r.user_id !== message.sender_id);
  const handleForward = () => onForward?.(message);

  // 1. Sleek Photo Attachment Media Card (16px radius, 2px solid #ff3b30, HD & time badges)
  const isPhoto = Boolean(
    message.message_type === "image" ||
    msgType === "image" ||
    msgType === "photo" ||
    Boolean(fileName.match(/\.(jpg|jpeg|png|gif|webp|svg|heic)$/i))
  );

  if (isPhoto) {
    return (
      <ImageMediaCard
        url={url}
        alt={fileName || "Photo"}
        timestamp={formattedTime}
        showReceipt={own}
        readBySomeoneElse={readBySomeoneElse}
        own={own}
        onForward={handleForward}
      />
    );
  }

  // 2. Telegram-Style Standalone Circular Video Note (1:1, 3px solid #ff3b30, tap-to-play)
  if (
    msgType === "video_note" ||
    msgMessageType === "video_note" ||
    fileName.includes("video-note") ||
    contentLower === "video note"
  ) {
    return (
      <VideoNoteBubble
        url={url}
        timestamp={formattedTime}
        showReceipt={own}
        readBySomeoneElse={readBySomeoneElse}
        own={own}
        onForward={handleForward}
      />
    );
  }

  // 3. Camera Capture & Video (Sleek Media Card with 16px radius, 2px solid #ff3b30, HD & time badges)
  const isVideo = Boolean(
    !isPhoto &&
    (msgType === "video" ||
     msgType === "camera_capture" ||
     msgMessageType === "video" ||
     msgMessageType === "camera_capture" ||
     (contentLower === "camera capture" && !fileName.match(/\.(jpg|jpeg|png|gif|webp|svg|heic)$/i)) ||
     contentLower === "video" ||
     fileName.startsWith("video-") ||
     fileName.includes("camera-capture") ||
     fileName.match(/\.(mp4|mov|mkv|avi)$/i) ||
     (fileName.match(/\.webm$/i) && !fileName.includes("voice-note") && msgType !== "audio" && msgType !== "voice_note" && contentLower !== "voice note"))
  );

  if (isVideo) {
    return (
      <VideoPlayerCard
        url={url}
        name={fileName || "Camera Capture"}
        timestamp={formattedTime}
        showReceipt={own}
        readBySomeoneElse={readBySomeoneElse}
        own={own}
        onForward={handleForward}
      />
    );
  }

  // 4. WhatsApp-Style Voice Note Bubble (Custom waveform, time, speed multiplier)
  const isAudio = Boolean(
    !isPhoto &&
    (msgType === "voice_note" ||
     msgType === "audio" ||
     msgMessageType === "audio" ||
     fileName.includes("voice-note") ||
     contentLower === "voice note" ||
     fileName.match(/\.(mp3|ogg|wav|m4a|aac|flac)$/i) ||
     (fileName.match(/\.webm$/i) && (fileName.includes("voice") || contentLower === "voice note" || msgType === "audio")))
  );

  if (isAudio) {
    return <VoiceNotePlayer url={url} own={own} />;
  }

  // 5. Standard Document / File attachment
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 flex min-w-60 items-center gap-3 rounded-xl border bg-background/65 p-3 transition hover:bg-background"
    >
      <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <FileText className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {fileName || "Attachment"}
        </span>
        <span className="block text-xs text-muted-foreground">
          {formatFileSize(message.attachment_size)}
        </span>
      </span>
      <Download className="size-4 text-muted-foreground" />
    </a>
  );
}
