"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  Pin,
  Star,
  X,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { AttachmentPreview } from "@/components/chat/attachment-preview";
import { MessageContextMenu } from "@/components/chat/message-context-menu";
import { GifMediaCard } from "@/components/chat/media/gif-media-card";
import { StickerBubble } from "@/components/chat/media/sticker-bubble";
import { PollCard, parsePollContent } from "@/components/chat/media/poll-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toggleMessageStar, useStarredIds } from "@/lib/starred-store";
import { toggleMessagePin, usePinnedMessageIds } from "@/lib/pinned-store";
import { createClient } from "@/lib/supabase/client";
import { cn, formatMessageTime, getInitials } from "@/lib/utils";
import { BUBBLE_STYLES, useAppearance } from "@/lib/appearance-store";
import type { ChatMessage, Profile } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId: string;
  showSenderName: boolean;
  showReceipt: boolean;
  reactions?: { [emoji: string]: string[] };
  onToggleReaction?: (emoji: string) => void;
  onProfileClick?: (profile: Profile) => void;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onForward?: (message: ChatMessage) => void;
  isMenuOpen?: boolean;
  onOpenMenu?: () => void;
  onCloseMenu?: () => void;
}

export function MessageBubble({
  message,
  currentUserId,
  showSenderName,
  showReceipt,
  reactions: externalReactions,
  onToggleReaction,
  onProfileClick,
  onReply,
  onEdit,
  onDelete,
  onForward,
  isMenuOpen: isMenuOpenProp,
  onOpenMenu,
  onCloseMenu,
}: MessageBubbleProps) {
  const own = message.sender_id === currentUserId;
  const readBySomeoneElse = message.read_receipts?.some((receipt) => receipt.user_id !== currentUserId);

  const { preferences } = useAppearance();
  const bubbleConf = BUBBLE_STYLES.find((b) => b.id === preferences.bubbleStyle) || BUBBLE_STYLES[0];

  const starredIds = useStarredIds(currentUserId);
  const isStarred = starredIds.has(message.id);

  const pinnedIds = usePinnedMessageIds(message.conversation_id);
  const isPinned = pinnedIds.has(message.id);

  const [localReactions, setLocalReactions] = useState<{ [emoji: string]: string[] }>({});
  const reactions = externalReactions || localReactions;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const [localMenuOpen, setLocalMenuOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<"top" | "bottom">("top");

  const menuOpen = isMenuOpenProp !== undefined ? isMenuOpenProp : localMenuOpen;

  const bubbleRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpen = useCallback(() => {
    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      if (rect.top < 320) {
        setMenuPlacement("bottom");
      } else {
        setMenuPlacement("top");
      }
    }
    if (onOpenMenu) {
      onOpenMenu();
    } else {
      setLocalMenuOpen(true);
    }
  }, [onOpenMenu]);

  const handleClose = useCallback(() => {
    if (onCloseMenu) {
      onCloseMenu();
    } else {
      setLocalMenuOpen(false);
    }
  }, [onCloseMenu]);

  // Listen to Escape key if running in standalone uncontrolled mode
  useEffect(() => {
    if (!menuOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, handleClose]);

  // Long-press event handlers (~500ms trigger on hold or right-click)
  const startLongPress = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if ("button" in e && e.button !== 0) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        handleOpen();
      }, 500);
    },
    [handleOpen]
  );

  const clearLongPress = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      clearLongPress();
      handleOpen();
    },
    [clearLongPress, handleOpen]
  );

  async function handleToggleStar() {
    const res = await toggleMessageStar(currentUserId, message.id, message.conversation_id, {
      content: message.content,
      attachment_name: message.attachment_name,
      attachment_path: message.attachment_path,
      sender_name: message.sender.display_name,
      sender_username: message.sender.username,
      sender_avatar: message.sender.avatar_url,
    });
    if (res.isStarred) {
      toast.success("Message starred");
    } else {
      toast.success("Message unstarred");
    }
  }

  function handleTogglePin() {
    const res = toggleMessagePin(message.conversation_id, message.id);
    if (res.isPinned) {
      toast.success("Message pinned");
    } else {
      toast.success("Message unpinned");
    }
  }

  async function handleCopyText(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }

  async function handleDownloadAttachment() {
    if (!message.attachment_path) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("chat-files")
        .createSignedUrl(message.attachment_path, 3600);

      if (error || !data?.signedUrl) {
        toast.error("Failed to generate download link");
        return;
      }

      const response = await fetch(data.signedUrl);
      if (!response.ok) throw new Error("Fetch failed");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = message.attachment_name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download started");
    } catch {
      try {
        const supabase = createClient();
        const { data } = await supabase.storage
          .from("chat-files")
          .createSignedUrl(message.attachment_path, 3600);
        if (data?.signedUrl) {
          const link = document.createElement("a");
          link.href = data.signedUrl;
          link.download = message.attachment_name || "download";
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success("Opening file download");
        }
      } catch {
        toast.error("Download failed");
      }
    }
  }

  function toggleReaction(emoji: string) {
    if (onToggleReaction) {
      onToggleReaction(emoji);
    } else {
      setLocalReactions((prev) => {
        const current = prev[emoji] || [];
        const hasReacted = current.includes(currentUserId);
        const next = hasReacted
          ? current.filter((id) => id !== currentUserId)
          : [...current, currentUserId];
        return { ...prev, [emoji]: next };
      });
    }
  }

  function handleSaveEdit(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (!editContent.trim() || !onEdit) return;
    onEdit(message.id, editContent.trim());
    setIsEditing(false);
  }

  const fileName = message.attachment_name || "";
  const isPhoto = Boolean(
    message.message_type === "image" ||
    (message as { type?: string }).type === "image" ||
    (message as { type?: string }).type === "photo" ||
    Boolean(fileName.match(/\.(jpg|jpeg|png|gif|webp|svg|heic)$/i))
  );

  const isVideoNote = Boolean(
    !isPhoto &&
    ((message as { type?: string }).type === "video_note" ||
     (message as { message_type?: string }).message_type === "video_note" ||
     fileName.includes("video-note") ||
     (message.attachment_path && message.content?.toLowerCase() === "video note"))
  );

  const isVideo = Boolean(
    !isPhoto &&
    !isVideoNote &&
    ((message as { type?: string }).type === "video" ||
     (message as { type?: string }).type === "camera_capture" ||
     (message as { message_type?: string }).message_type === "video" ||
     (message as { message_type?: string }).message_type === "camera_capture" ||
     fileName.startsWith("video-") ||
     fileName.includes("camera-capture") ||
     fileName.match(/\.(mp4|mov|mkv|avi)$/i) ||
     (fileName.endsWith(".webm") && !fileName.includes("voice-note") && message.content?.toLowerCase() !== "voice note"))
  );
  // Check for Markdown GIF: ![GIF](url)
  const gifMatch = message.content?.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/i);
  const isGif = Boolean(gifMatch);
  const gifUrl = gifMatch ? gifMatch[2] : null;

  // Check for Sticker: e.g. 🚀 *(To The Moon)*
  const stickerMatch = message.content?.match(/^(\S+)\s*\*\((.*?)\)\*$/);
  const isSticker = Boolean(stickerMatch && !isGif);
  const stickerEmoji = stickerMatch ? stickerMatch[1] : undefined;
  const stickerLabel = stickerMatch ? stickerMatch[2] : undefined;

  // Check for Poll: **POLL: Question**
  const parsedPoll = parsePollContent(message.content || "");
  const isPoll = Boolean(parsedPoll);

  const isCustomRichCard = Boolean(isGif || isSticker || isPoll);
  const isMedia = Boolean(isVideoNote || isVideo || isPhoto || isCustomRichCard);

  const isVoiceNote = Boolean(
    !isVideo &&
    !isVideoNote &&
    ((message as { type?: string }).type === "voice_note" ||
     (message as { type?: string }).type === "audio" ||
     message.attachment_name?.includes("voice-note") ||
     (message.attachment_path && message.content?.toLowerCase() === "voice note"))
  );

  const contentLower = message.content?.trim().toLowerCase();
  const isGenericMediaLabel = Boolean(
    contentLower === "photo" ||
    contentLower === "camera capture" ||
    contentLower === "video" ||
    contentLower === "video note" ||
    contentLower === "voice note"
  );

  const showTextContent = Boolean(
    message.content &&
    !isCustomRichCard &&
    !(isMedia && isGenericMediaLabel) &&
    !(isVoiceNote && contentLower === "voice note")
  );

  function handleForwardMessage() {
    if (onForward) {
      onForward(message);
    } else if (onReply) {
      onReply(message);
    } else {
      toast.info("Forwarding message...");
    }
  }

  return (
    <div
      className={cn(
        "group relative flex items-end gap-2.5 my-1.5 sm:my-2 transition-all animate-message-appear",
        own ? "justify-end" : "justify-start"
      )}
    >
      {!own && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onProfileClick?.(message.sender);
          }}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full cursor-pointer hover:opacity-80 transition"
          aria-label={`View ${message.sender.display_name}'s profile`}
        >
          <Avatar className="size-8 shrink-0 border border-border shadow-sm">
            <AvatarImage src={message.sender.avatar_url || undefined} alt={message.sender.display_name} />
            <AvatarFallback className="text-xs">{getInitials(message.sender.display_name)}</AvatarFallback>
          </Avatar>
        </button>
      )}

      {/* Bubble Container with Stacking Context Elevation (z-index 50 when menu open, 1 when inactive) */}
      <div
        ref={bubbleRef}
        onMouseDown={startLongPress}
        onMouseUp={clearLongPress}
        onMouseLeave={clearLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={clearLongPress}
        onTouchMove={clearLongPress}
        onContextMenu={handleContextMenu}
        className={cn(
          "relative flex flex-col w-fit max-w-[70%]",
          menuOpen ? "z-50" : "z-1",
          own && "items-end"
        )}
        style={{
          maxWidth: "70%",
          position: "relative",
          zIndex: menuOpen ? 50 : 1,
        }}
      >
        {showSenderName && !own && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onProfileClick?.(message.sender);
            }}
            className="mb-1 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground text-left cursor-pointer transition-colors"
          >
            {message.sender.display_name}
          </button>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "chat-bubble message-bubble relative transition-all select-text w-fit max-w-[70%] break-words [word-break:break-word] [overflow-wrap:break-word]",
            (isMedia && !showTextContent) || isCustomRichCard
              ? "!bg-transparent !p-0 !border-0 !shadow-none"
              : cn(
                  isVoiceNote && !showTextContent ? "!p-0 shadow-xs" : "shadow-xs",
                  own
                    ? cn(bubbleConf.ownClass, "bg-primary text-primary-foreground shadow-primary/20")
                    : cn(bubbleConf.peerClass, "bg-muted text-foreground")
                )
          )}
          style={{
            width: "fit-content",
            maxWidth: "70%",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            borderRadius: isVideoNote && !showTextContent ? "50%" : "12px",
            ...((isMedia && !showTextContent) || isCustomRichCard
              ? { background: "transparent", padding: 0, border: "none", boxShadow: "none" }
              : isVoiceNote && !showTextContent
                ? { padding: 0 }
                : { padding: "6px 10px" }),
          }}
        >
          {/* Content / Edit mode */}
          {isEditing ? (
            <div className="space-y-2.5 min-w-60" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="text-xs bg-background border-border text-foreground rounded-xl"
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <Button size="icon-sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}>
                  <X className="size-3.5" />
                </Button>
                <Button size="icon-sm" className="bg-primary text-primary-foreground font-bold" onClick={handleSaveEdit}>
                  <Check className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : isGif && gifUrl ? (
            <GifMediaCard
              url={gifUrl}
              alt="GIF"
              timestamp={formatMessageTime(message.created_at)}
              showReceipt={own}
              readBySomeoneElse={readBySomeoneElse}
              own={own}
              onForward={handleForwardMessage}
            />
          ) : isSticker ? (
            <StickerBubble
              emoji={stickerEmoji}
              label={stickerLabel}
              timestamp={formatMessageTime(message.created_at)}
              showReceipt={own}
              readBySomeoneElse={readBySomeoneElse}
              own={own}
            />
          ) : isPoll && parsedPoll ? (
            <PollCard
              messageId={message.id}
              poll={parsedPoll}
              timestamp={formatMessageTime(message.created_at)}
              showReceipt={own}
              readBySomeoneElse={readBySomeoneElse}
              own={own}
            />
          ) : (
            <>
              {showTextContent && (
                <p
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.45,
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                  className="whitespace-pre-wrap break-words [word-break:break-word] [overflow-wrap:break-word] text-[14px] leading-[1.45]"
                >
                  {message.content}
                </p>
              )}
              {message.attachment_path && (
                <AttachmentPreview
                  message={message}
                  own={own}
                  onForward={handleForwardMessage}
                />
              )}
            </>
          )}

          {/* Time, Read Receipts, Star & Pin Badges */}
          {(!isMedia || showTextContent) && !isCustomRichCard && (
            <div
              className={cn(
                "mt-1 flex items-center justify-end gap-1 text-[10px]",
                isVoiceNote && !showTextContent
                  ? "px-2.5 pb-1.5 -mt-0.5"
                  : "pt-0.5",
                own ? "text-primary-foreground/75" : "text-muted-foreground"
              )}
            >
              {isPinned && (
                <Pin
                  className={cn(
                    "size-2.5 shrink-0 rotate-45",
                    own && !isMedia ? "fill-primary-foreground text-primary-foreground" : "fill-primary text-primary"
                  )}
                  aria-label="Pinned message"
                />
              )}
              {isStarred && (
                <Star
                  className={cn(
                    "size-2.5 shrink-0",
                    own && !isMedia ? "fill-primary-foreground text-primary-foreground" : "fill-amber-400 text-amber-400"
                  )}
                  aria-label="Starred message"
                />
              )}
              <time>{formatMessageTime(message.created_at)}</time>
              {message.edited_at && <span>· edited</span>}
              {own && showReceipt && (
                readBySomeoneElse ? (
                  <CheckCheck className={cn("size-3.5", own && !isMedia ? "text-primary-foreground/90" : "text-primary")} aria-label="Read" />
                ) : (
                  <Check className={cn("size-3.5", own && !isMedia ? "text-primary-foreground/60" : "text-muted-foreground")} aria-label="Sent" />
                )
              )}
            </div>
          )}

          {/* Reaction Pills below message */}
          {Object.entries(reactions).some(([, users]) => users.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
              {Object.entries(reactions).map(([emoji, users]) => {
                if (!users.length) return null;
                const active = users.includes(currentUserId);
                return (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction(emoji)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all shadow-sm active:scale-95",
                      active
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-muted border-border text-muted-foreground hover:border-foreground/20"
                    )}
                  >
                    <span>{emoji}</span>
                    <span>{users.length}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Separated Frosted Glass Message Context Menu */}
        {menuOpen && (
          <MessageContextMenu
            message={message}
            own={own}
            placement={menuPlacement}
            isStarred={isStarred}
            isPinned={isPinned}
            onClose={handleClose}
            onReact={toggleReaction}
            onReply={onReply}
            onCopy={handleCopyText}
            onDownload={handleDownloadAttachment}
            onForward={handleForwardMessage}
            onPin={handleTogglePin}
            onStar={handleToggleStar}
            onEdit={own && onEdit && showTextContent ? () => setIsEditing(true) : undefined}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
}
