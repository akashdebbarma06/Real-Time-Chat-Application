"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  CornerUpLeft,
  Download,
  MoreVertical,
  Pin,
  Reply,
  Share2,
  Smile,
  Star,
  Trash2,
  Video,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { toggleMessagePin, usePinnedMessageIds } from "@/lib/pinned-store";
import { toggleMessageStar, useStarredIds } from "@/lib/starred-store";
import { cn, formatMessageTime, getInitials } from "@/lib/utils";
import type { ChatMessage, Profile } from "@/types/chat";

interface WhatsAppMediaLightboxProps {
  open: boolean;
  activeMessageId: string | null;
  initialUrl?: string | null;
  conversationMediaMessages: ChatMessage[];
  currentUserId: string;
  conversationId: string;
  onClose: () => void;
  onReply?: (message: ChatMessage) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onForward?: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => void;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function WhatsAppMediaLightbox({
  open,
  activeMessageId,
  initialUrl,
  conversationMediaMessages,
  currentUserId,
  conversationId,
  onClose,
  onReply,
  onToggleReaction,
  onForward,
  onDelete,
}: WhatsAppMediaLightboxProps) {
  // Track selected message ID
  const [currentId, setCurrentId] = useState<string | null>(activeMessageId);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showReactions, setShowReactions] = useState(false);

  // Cache resolved signed URLs by message id
  const [urlCache, setUrlCache] = useState<Record<string, string>>({});
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const carouselContainerRef = useRef<HTMLDivElement | null>(null);

  // Synchronize when activeMessageId opens
  useEffect(() => {
    if (activeMessageId) {
      setCurrentId(activeMessageId);
      setZoomLevel(1);
      setShowReactions(false);
      if (initialUrl) {
        setUrlCache((prev) => ({ ...prev, [activeMessageId]: initialUrl }));
      }
    }
  }, [activeMessageId, initialUrl]);

  // Current active index in the media array
  const activeIndex = useMemo(() => {
    if (!currentId || !conversationMediaMessages.length) return 0;
    const idx = conversationMediaMessages.findIndex((m) => m.id === currentId);
    return idx >= 0 ? idx : 0;
  }, [currentId, conversationMediaMessages]);

  const currentMessage = conversationMediaMessages[activeIndex] || null;

  // Resolve signed URL for current and neighbouring items
  useEffect(() => {
    if (!open || !conversationMediaMessages.length) return;

    const supabase = createClient();
    const toResolve = conversationMediaMessages.slice(
      Math.max(0, activeIndex - 2),
      Math.min(conversationMediaMessages.length, activeIndex + 3)
    );

    toResolve.forEach((msg) => {
      if (!msg.attachment_path || urlCache[msg.id]) return;
      void supabase.storage
        .from("chat-files")
        .createSignedUrl(msg.attachment_path, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) {
            setUrlCache((prev) => ({ ...prev, [msg.id]: data.signedUrl }));
          }
        });
    });
  }, [open, activeIndex, conversationMediaMessages, urlCache]);

  // Scroll active thumbnail into center of bottom carousel
  useEffect(() => {
    if (!open || !currentId || !carouselContainerRef.current) return;
    const thumbEl = carouselContainerRef.current.querySelector(
      `[data-thumb-id="${currentId}"]`
    ) as HTMLElement | null;
    if (thumbEl) {
      thumbEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [open, currentId]);

  // Star and Pin state
  const starredIds = useStarredIds(currentUserId);
  const isStarred = currentMessage ? starredIds.has(currentMessage.id) : false;

  const pinnedIds = usePinnedMessageIds(conversationId);
  const isPinned = currentMessage ? pinnedIds.has(currentMessage.id) : false;

  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < conversationMediaMessages.length - 1;

  const goToPrevious = useCallback(() => {
    if (hasPrev) {
      const prevMsg = conversationMediaMessages[activeIndex - 1];
      setCurrentId(prevMsg.id);
      setZoomLevel(1);
    }
  }, [hasPrev, activeIndex, conversationMediaMessages]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      const nextMsg = conversationMediaMessages[activeIndex + 1];
      setCurrentId(nextMsg.id);
      setZoomLevel(1);
    }
  }, [hasNext, activeIndex, conversationMediaMessages]);

  // Keyboard navigation: Left/Right arrows and ESC
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, goToPrevious, goToNext]);

  if (!open || !currentMessage) return null;

  const currentUrl = urlCache[currentMessage.id] || "";
  const fileName = currentMessage.attachment_name || "";
  const isVideo = Boolean(
    (currentMessage.message_type as string) === "video" ||
    currentMessage.type === "video" ||
    fileName.match(/\.(mp4|mov|mkv|webm|avi)$/i)
  );

  const own = currentMessage.sender_id === currentUserId;

  // Zoom toggler
  function toggleZoom() {
    setZoomLevel((prev) => (prev === 1 ? 1.75 : 1));
  }

  // Download media file
  function handleDownload() {
    if (!currentUrl) return;
    const a = document.createElement("a");
    a.href = currentUrl;
    a.download = fileName || (isVideo ? "video.mp4" : "image.jpg");
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Media Lightbox"
      className="fixed inset-0 z-[10000] flex flex-col bg-background/95 text-foreground backdrop-blur-2xl animate-in fade-in duration-200 select-none overflow-hidden"
    >
      {/* ── 1. Top Header ── */}
      <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 sm:px-6">
        {/* Left: Sender Avatar, Display Name, & Message Timestamp */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="size-10 border border-border shadow-sm shrink-0">
            <AvatarImage
              src={currentMessage.sender?.avatar_url || undefined}
              alt={currentMessage.sender?.display_name || "Sender"}
            />
            <AvatarFallback className="text-xs bg-muted text-foreground">
              {getInitials(currentMessage.sender?.display_name || "User")}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-semibold text-foreground">
              {own ? "You" : currentMessage.sender?.display_name || "Sender"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatMessageTime(currentMessage.created_at)}
            </span>
          </div>
        </div>

        {/* Right Action Controls: Zoom, Reply, Star, Pin, React, Download, 3-dot, Close */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom (Images only) */}
          {!isVideo && (
            <button
              type="button"
              onClick={toggleZoom}
              title={zoomLevel > 1 ? "Zoom Out" : "Zoom In"}
              aria-label="Zoom"
              className={cn(
                "flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
                zoomLevel > 1 && "text-primary bg-primary/10"
              )}
            >
              {zoomLevel > 1 ? <ZoomOut className="size-5" /> : <ZoomIn className="size-5" />}
            </button>
          )}

          {/* Reply */}
          <button
            type="button"
            onClick={() => {
              onReply?.(currentMessage);
              onClose();
            }}
            title="Reply"
            aria-label="Reply"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <Reply className="size-5" />
          </button>

          {/* Star */}
          <button
            type="button"
            onClick={() =>
              toggleMessageStar(currentUserId, currentMessage.id, conversationId, {
                content: currentMessage.content,
                attachment_name: currentMessage.attachment_name,
                attachment_path: currentMessage.attachment_path,
                sender_name: currentMessage.sender?.display_name,
                sender_username: currentMessage.sender?.username,
                sender_avatar: currentMessage.sender?.avatar_url,
              })
            }
            title={isStarred ? "Unstar message" : "Star message"}
            aria-label="Star"
            className={cn(
              "flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
              isStarred && "text-amber-400 fill-amber-400"
            )}
          >
            <Star className={cn("size-5", isStarred && "fill-amber-400 text-amber-400")} />
          </button>

          {/* Pin */}
          <button
            type="button"
            onClick={() => toggleMessagePin(conversationId, currentMessage.id)}
            title={isPinned ? "Unpin message" : "Pin message"}
            aria-label="Pin"
            className={cn(
              "flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
              isPinned && "text-primary"
            )}
          >
            <Pin className={cn("size-5 rotate-45", isPinned && "text-primary")} />
          </button>

          {/* React */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowReactions(!showReactions)}
              title="React"
              aria-label="React"
              className={cn(
                "flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
                showReactions && "text-primary bg-primary/10"
              )}
            >
              <Smile className="size-5" />
            </button>

            {/* Quick Emoji Reaction Pill */}
            {showReactions && (
              <div className="absolute right-0 top-12 z-50 flex items-center gap-1.5 rounded-full border border-border bg-popover p-1.5 shadow-2xl animate-in zoom-in-95 duration-150">
                {EMOJI_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onToggleReaction?.(currentMessage.id, emoji);
                      setShowReactions(false);
                    }}
                    className="flex size-8 items-center justify-center rounded-full text-lg hover:bg-muted transition-transform hover:scale-125 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            title="Download"
            aria-label="Download"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <Download className="size-5" />
          </button>

          {/* 3-dot Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="More options"
                aria-label="More options"
                className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <MoreVertical className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl"
            >
              <DropdownMenuItem
                onClick={() => onForward?.(currentMessage)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <Share2 className="size-4" />
                <span>Forward</span>
              </DropdownMenuItem>
              {own && (
                <DropdownMenuItem
                  onClick={() => {
                    onDelete?.(currentMessage.id);
                    onClose();
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="size-4" />
                  <span>Delete message</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-px bg-border mx-1" />

          {/* Close (✕) Button */}
          <button
            type="button"
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      {/* ── 2. Center Viewport: Selected Image/Video & Navigation Arrows ── */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
        {/* Previous Media Arrow */}
        <button
          type="button"
          disabled={!hasPrev}
          onClick={goToPrevious}
          title="Previous media"
          aria-label="Previous"
          className="absolute left-4 sm:left-6 z-30 flex size-12 items-center justify-center rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 shadow-xl transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="size-6" />
        </button>

        {/* Media Container */}
        <div className="relative flex max-h-[72vh] max-w-5xl items-center justify-center overflow-hidden">
          {isVideo ? (
            <video
              ref={activeVideoRef}
              key={currentUrl}
              src={currentUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl bg-black"
            />
          ) : currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt={fileName || "Shared photo"}
              style={{
                transform: `scale(${zoomLevel})`,
              }}
              className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl transition-transform duration-200"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 p-12 text-muted-foreground">
              <div className="size-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <span className="text-xs">Loading media...</span>
            </div>
          )}
        </div>

        {/* Next Media Arrow */}
        <button
          type="button"
          disabled={!hasNext}
          onClick={goToNext}
          title="Next media"
          aria-label="Next"
          className="absolute right-4 sm:right-6 z-30 flex size-12 items-center justify-center rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 shadow-xl transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer hover:scale-105 active:scale-95"
        >
          <ChevronRight className="size-6" />
        </button>
      </main>

      {/* ── 3. Bottom Carousel: Thumbnail Strip with Dynamic Active Border & Duration Badges ── */}
      <footer className="relative z-20 flex h-24 shrink-0 items-center border-t border-border bg-card/95 px-6 overflow-hidden">
        <div
          ref={carouselContainerRef}
          className="flex w-full items-center gap-3 overflow-x-auto py-2 scrollbar-none"
        >
          {conversationMediaMessages.map((msg, index) => {
            const thumbUrl = urlCache[msg.id];
            const msgFileName = msg.attachment_name || "";
            const isMsgVideo = Boolean(
              (msg.message_type as string) === "video" ||
              msg.type === "video" ||
              msgFileName.match(/\.(mp4|mov|mkv|webm|avi)$/i)
            );
            const isActive = msg.id === currentId;

            return (
              <button
                key={msg.id}
                data-thumb-id={msg.id}
                type="button"
                onClick={() => {
                  setCurrentId(msg.id);
                  setZoomLevel(1);
                }}
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-black transition-all cursor-pointer",
                  isActive
                    ? "border-primary ring-2 ring-primary scale-105 shadow-lg shadow-primary/30"
                    : "border-transparent opacity-50 hover:opacity-100 hover:border-border"
                )}
              >
                {thumbUrl ? (
                  isMsgVideo ? (
                    <video
                      src={thumbUrl}
                      className="size-full object-cover"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbUrl}
                      alt="Thumbnail"
                      className="size-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
                    {isMsgVideo ? <Video className="size-5" /> : <span className="text-[10px]">Photo</span>}
                  </div>
                )}

                {/* Duration Badge for Videos */}
                {isMsgVideo && (
                  <div className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded bg-black/75 px-1 py-0.2 text-[9px] font-mono font-medium text-white shadow-sm border border-white/10">
                    <span className="text-[8px]">▶</span>
                    <span>0:15</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
