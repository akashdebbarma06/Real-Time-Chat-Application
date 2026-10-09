"use client";

import { useState } from "react";
import { CornerUpLeft, Copy, Download, Forward, Pin, Star, Pencil, Trash2 } from "lucide-react";
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

  const hasText = Boolean(message.content && message.content.trim().length > 0 && message.content.toLowerCase() !== "video note" && message.content.toLowerCase() !== "voice note" && message.content.toLowerCase() !== "camera capture");

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute z-50 flex flex-col gap-2 select-none message-context-menu animate-in fade-in zoom-in-95 duration-150",
        placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
        own ? "right-0 items-end" : "left-0 items-start"
      )}
      style={{
        zIndex: 50,
      }}
    >
      {/* 1. Emoji Reaction Pill (Separated, Frosted Glass) */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/12 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] text-white w-fit"
        style={{
          backgroundColor: "rgba(26, 32, 44, 0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        }}
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
            setShowFullPicker((prev) => !prev);
          }}
          className={cn(
            "text-gray-400 hover:text-white font-semibold text-lg ml-1 leading-none transition-colors cursor-pointer",
            showFullPicker && "text-white"
          )}
          title="More reactions"
        >
          +
        </button>
      </div>

      {/* Extended Emoji Picker if Plus clicked */}
      {showFullPicker && (
        <div
          className="p-2 rounded-2xl border border-white/12 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] grid grid-cols-6 gap-1 max-h-36 overflow-y-auto scrollbar-thin text-white w-fit animate-in fade-in zoom-in-95 duration-100"
          style={{
            backgroundColor: "rgba(26, 32, 44, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {EXTENDED_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact(emoji);
                onClose();
              }}
              className="hover:scale-125 transition-transform duration-150 text-base p-1 cursor-pointer leading-none"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* 2. Action Menu Dropdown (Separated, Frosted Glass) */}
      <div
        className="w-48 py-1.5 rounded-2xl border border-white/12 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] flex flex-col text-sm text-gray-200 overflow-hidden"
        style={{
          backgroundColor: "rgba(26, 32, 44, 0.80)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        }}
      >
        {onReply && (
          <button
            type="button"
            onClick={() => {
              onReply(message);
              onClose();
            }}
            className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors w-full text-left text-xs font-medium cursor-pointer"
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
            className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors w-full text-left text-xs font-medium cursor-pointer"
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
            className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors w-full text-left text-xs font-medium cursor-pointer"
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
            className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors w-full text-left text-xs font-medium cursor-pointer"
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
            className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors w-full text-left text-xs font-medium cursor-pointer"
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
            className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors w-full text-left text-xs font-medium cursor-pointer"
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
            className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors w-full text-left text-xs font-medium cursor-pointer"
          >
            <span className="text-sm">✏</span>
            <span>Edit</span>
          </button>
        )}

        {onDelete && (
          <>
            <div className="h-px bg-white/10 my-1" />
            <button
              type="button"
              onClick={() => {
                onDelete(message.id);
                onClose();
              }}
              className="flex items-center gap-3 px-4 py-2 hover:bg-red-500/20 text-red-400 transition-colors w-full text-left text-xs font-medium cursor-pointer"
            >
              <span className="text-sm">🗑</span>
              <span>Delete</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
