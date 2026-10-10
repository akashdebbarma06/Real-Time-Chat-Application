"use client";

import { useEffect, useRef, useState } from "react";
import { CornerUpLeft, Copy, Download, Forward, Pin, Star, Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const EXTENDED_EMOJIS = [
  "👍", "❤️", "😂", "😮", "😢", "🙏",
  "🔥", "🎉", "👏", "💯", "🤝", "🥰",
  "🚀", "👀", "✨", "🤔", "🤩", "💔",
  "😍", "🙌", "💪", "😎", "🥳", "⚡",
];

export interface MessageContextMenuProps {
  message: ChatMessage;
  own: boolean;
  placement?: "top" | "bottom";
  isStarred?: boolean;
  isPinned?: boolean;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply?: (message: ChatMessage) => void;
  onCopy?: (text: string) => void;
  onDownload?: () => void;
  onForward?: (message: ChatMessage) => void;
  onPin?: () => void;
  onStar?: () => void;
  onEdit?: () => void;
  onDelete?: (messageId: string) => void;
}

export function MessageContextMenu({
  message,
  own,
  placement = "top",
  isStarred = false,
  isPinned = false,
  onClose,
  onReact,
  onReply,
  onCopy,
  onDownload,
  onForward,
  onPin,
  onStar,
  onEdit,
  onDelete,
}: MessageContextMenuProps) {
  const [showFullPicker, setShowFullPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [shiftX, setShiftX] = useState(0);
  const [effectivePlacement, setEffectivePlacement] = useState(placement);

  // Sync and dynamically verify vertical placement
  useEffect(() => {
    setEffectivePlacement(placement);
  }, [placement]);

  // Viewport collision detection: clamp horizontal coordinates and prevent vertical cutoff
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const padding = 12; // 12px viewport gutter
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Clamp horizontal coordinates so menu never bleeds outside left or right boundaries
    let offsetX = 0;
    if (rect.right > viewportWidth - padding) {
      offsetX = (viewportWidth - padding) - rect.right;
    } else if (rect.left < padding) {
      offsetX = padding - rect.left;
    }
    setShiftX(offsetX);

    // If space below is insufficient (< 300px) or menu cuts off at bottom, flip to render ABOVE
    const spaceBelow = viewportHeight - rect.bottom;
    if ((spaceBelow < 0 || rect.bottom > viewportHeight - padding) && effectivePlacement === "bottom") {
      setEffectivePlacement("top");
    }
  }, [showFullPicker, effectivePlacement]);

  const isMedia = Boolean(
    message.type === "image" ||
    message.type === "video" ||
    message.type === "video_note" ||
    message.type === "voice_note" ||
    message.type === "file" ||
    message.message_type === "image" ||
    message.message_type === "file" ||
    (message.message_type as string) === "video" ||
    (message.message_type as string) === "video_note" ||
    message.attachment_path
  );

  const hasText = Boolean(
    message.content &&
    message.content.trim().length > 0 &&
    message.content.toLowerCase() !== "video note" &&
    message.content.toLowerCase() !== "voice note" &&
    message.content.toLowerCase() !== "camera capture"
  );

  return (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute z-50 flex flex-col gap-2 select-none message-context-menu animate-in fade-in zoom-in-95 duration-150",
        effectivePlacement === "top" ? "bottom-full mb-2" : "top-full mt-2",
        own ? "right-0 items-end" : "left-0 items-start"
      )}
      style={{
        zIndex: 50,
        transform: shiftX ? `translateX(${shiftX}px)` : undefined,
      }}
    >
      {/* 1. Extended Emoji Picker (replaces quick strip & hides actions to prevent stacking conflicts) */}
      {showFullPicker ? (
        <div
          className="p-3 rounded-2xl border border-border bg-popover/95 text-popover-foreground shadow-2xl shadow-black/20 flex flex-col gap-2 w-64 backdrop-blur-2xl animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 select-none"
        >
          {/* Header with Title and Close Icon */}
          <div className="flex items-center justify-between px-1 pb-1 border-b border-border/60">
            <span className="text-xs font-semibold text-muted-foreground">Reactions</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullPicker(false);
              }}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              aria-label="Close reaction picker"
              title="Close"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Emoji Grid */}
          <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto scrollbar-thin p-0.5">
            {EXTENDED_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onReact(emoji);
                  onClose();
                }}
                className="hover:scale-125 transition-transform duration-150 text-xl p-1 cursor-pointer leading-none hover:bg-muted/60 rounded-xl grid place-items-center"
                title={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Quick 6-Icon Emoji Reaction Strip */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-popover/90 text-popover-foreground shadow-xl shadow-black/20 backdrop-blur-xl w-fit"
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onReact(emoji);
                  onClose();
                }}
                className="hover:scale-125 transition-transform duration-150 text-lg px-0.5 cursor-pointer leading-none"
                title={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullPicker(true);
              }}
              className="text-muted-foreground hover:text-foreground font-semibold text-lg ml-1 leading-none transition-colors cursor-pointer"
              title="More reactions"
            >
              +
            </button>
          </div>

          {/* Action Menu Dropdown List */}
          <div
            className="w-48 py-1.5 rounded-2xl border border-border bg-popover/95 text-popover-foreground shadow-2xl shadow-black/20 flex flex-col text-sm overflow-hidden backdrop-blur-2xl"
          >
            {onReply && (
              <button
                type="button"
                onClick={() => {
                  onReply(message);
                  onClose();
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-muted hover:text-foreground transition-colors w-full text-left text-xs font-medium cursor-pointer"
              >
                <span className="text-sm">↩</span>
                <span>Reply</span>
              </button>
            )}

            {hasText && onCopy && (
              <button
                type="button"
                onClick={() => {
                  onCopy(message.content);
                  onClose();
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-muted hover:text-foreground transition-colors w-full text-left text-xs font-medium cursor-pointer"
              >
                <span className="text-sm">📋</span>
                <span>Copy</span>
              </button>
            )}

            {isMedia && onDownload && (
              <button
                type="button"
                onClick={() => {
                  onDownload();
                  onClose();
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-muted hover:text-foreground transition-colors w-full text-left text-xs font-medium cursor-pointer"
              >
                <span className="text-sm">⬇</span>
                <span>Download</span>
              </button>
            )}

            {onForward && (
              <button
                type="button"
                onClick={() => {
                  onForward(message);
                  onClose();
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-muted hover:text-foreground transition-colors w-full text-left text-xs font-medium cursor-pointer"
              >
                <span className="text-sm">➡</span>
                <span>Forward</span>
              </button>
            )}

            {onPin && (
              <button
                type="button"
                onClick={() => {
                  onPin();
                  onClose();
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-muted hover:text-foreground transition-colors w-full text-left text-xs font-medium cursor-pointer"
              >
                <span className="text-sm">📌</span>
                <span>{isPinned ? "Unpin" : "Pin"}</span>
              </button>
            )}

            {onStar && (
              <button
                type="button"
                onClick={() => {
                  onStar();
                  onClose();
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-muted hover:text-foreground transition-colors w-full text-left text-xs font-medium cursor-pointer"
              >
                <span className="text-sm">⭐</span>
                <span>{isStarred ? "Unstar" : "Star"}</span>
              </button>
            )}

            {own && onEdit && hasText && (
              <button
                type="button"
                onClick={() => {
                  onEdit();
                  onClose();
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-muted hover:text-foreground transition-colors w-full text-left text-xs font-medium cursor-pointer"
              >
                <span className="text-sm">✏</span>
                <span>Edit</span>
              </button>
            )}

            {onDelete && (
              <>
                <div className="h-px bg-border my-1" />
                <button
                  type="button"
                  onClick={() => {
                    onDelete(message.id);
                    onClose();
                  }}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors w-full text-left text-xs font-medium cursor-pointer"
                >
                  <span className="text-sm">🗑</span>
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
