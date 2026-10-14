"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertCircle, Download, FileText, Loader2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatFileSize, formatMessageTime } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { VoiceNotePlayer } from "@/components/chat/media/voice-note-player";
import { VideoPlayerCard } from "@/components/chat/media/video-player-card";
import { VideoNoteBubble } from "@/components/chat/media/video-note-bubble";
import { ImageMediaCard } from "@/components/chat/media/image-media-card";
import { getLocalMediaBlob, saveLocalMediaBlob } from "@/lib/storage/local-db";

interface AttachmentPreviewProps {
  message: ChatMessage;
  own?: boolean;
  onForward?: (message: ChatMessage) => void;
  onMediaClick?: (message: ChatMessage, url: string) => void;
}

export function AttachmentPreview({
  message,
  own = false,
  onForward,
  onMediaClick,
}: AttachmentPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!message.attachment_path) return;
    let active = true;
    setStatus("loading");
    setErrorMsg(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 12000);

    async function resolveMedia() {
      const mediaId = message.attachment_path!;

      // 1. Client-Side Persistent Storage: Check local IndexedDB first (0 network latency)
      try {
        const local = await getLocalMediaBlob(mediaId);
        if (local && active) {
          clearTimeout(timeoutId);
          setUrl(local.url);
          setStatus("ready");
          return;
        }
      } catch (e) {
        console.warn("[AttachmentPreview] IndexedDB check failed, falling back to network:", e);
      }

      // 2. Fetch binary from backend queue if not yet cached on user's device
      try {
        const supabase = createClient();
        const { data: signData, error: signError } = await supabase.storage
          .from("chat-files")
          .createSignedUrl(mediaId, 3600);

        if (signError || !signData?.signedUrl) {
          throw new Error(signError?.message || "Could not generate download link");
        }

        const downloadUrl = signData.signedUrl;

        // Fetch file blob with timeout
        const res = await fetch(downloadUrl, { signal: controller.signal });
        if (!res.ok) {
          if (active) {
            clearTimeout(timeoutId);
            setUrl(downloadUrl);
            setStatus("ready");
          }
          return;
        }
        const blob = await res.blob();

        const fileName = message.attachment_name || "attachment";
        const mimeType = blob.type || (message.message_type === "image" ? "image/jpeg" : "application/octet-stream");

        // Save Blob into client IndexedDB persistent storage
        const localBlobUrl = await saveLocalMediaBlob(
          mediaId,
          message.conversation_id,
          fileName,
          mimeType,
          blob,
          message.attachment_size || blob.size
        );

        if (active) {
          clearTimeout(timeoutId);
          setUrl(localBlobUrl);
          setStatus("ready");
        }

        // Ephemeral Auto-Purge Flow: Send download ACK to purge binary from backend object storage
        void fetch("/api/media/ack-download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId }),
        }).catch((ackErr) => {
          console.warn("[Media ACK] Ephemeral purge warning:", ackErr);
        });
      } catch (err: unknown) {
        if (!active) return;
        clearTimeout(timeoutId);
        console.error("[AttachmentPreview] Failed to resolve media:", err);
        const isTimeout = err instanceof Error && err.name === "AbortError";
        setErrorMsg(isTimeout ? "Network timeout while preparing attachment" : "Could not load attachment");
        setStatus("error");
      }
    }

    void resolveMedia();

    return () => {
      active = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [message.attachment_path, message.attachment_name, message.attachment_size, message.conversation_id, message.message_type, retryCount]);

  if (status === "loading" || !url) {
    if (status === "error") {
      return (
        <div className="flex flex-col gap-1.5 py-2 px-3 rounded-xl border border-destructive/20 bg-destructive/5 text-xs max-w-xs">
          <div className="flex items-center gap-2 text-destructive font-medium">
            <AlertCircle className="size-4 shrink-0" />
            <span className="truncate">{errorMsg || "Failed to load attachment"}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              <RefreshCw className="size-3" />
              Retry
            </button>
          </div>
        </div>
      );
    }

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

  // 1. Sleek Photo Attachment Media Card (16px radius, dynamic border, HD & time badges)
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
        onMediaClick={() => onMediaClick?.(message, url)}
      />
    );
  }

  // 2. Telegram-Style Standalone Circular Video Note (1:1, primary border, tap-to-play)
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

  // 3. Camera Capture & Video (Sleek Media Card with 16px radius, dynamic border, HD & time badges)
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
        onMediaClick={() => onMediaClick?.(message, url)}
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
