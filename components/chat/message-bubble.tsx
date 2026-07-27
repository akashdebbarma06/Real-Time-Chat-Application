"use client";

import { useState } from "react";
import {
  Check,
  CheckCheck,
  CornerUpLeft,
  Pencil,
  Smile,
  Trash2,
  X,
} from "lucide-react";
import { AttachmentPreview } from "@/components/chat/attachment-preview";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatMessageTime, getInitials } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId: string;
  showSenderName: boolean;
  showReceipt: boolean;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageBubble({
  message,
  currentUserId,
  showSenderName,
  showReceipt,
  onReply,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const own = message.sender_id === currentUserId;
  const readBySomeoneElse = message.read_receipts?.some((receipt) => receipt.user_id !== currentUserId);

  const [reactions, setReactions] = useState<{ [emoji: string]: string[] }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");

  function toggleReaction(emoji: string) {
    setReactions((prev) => {
      const current = prev[emoji] || [];
      const hasReacted = current.includes(currentUserId);
      const next = hasReacted
        ? current.filter((id) => id !== currentUserId)
        : [...current, currentUserId];
      return { ...prev, [emoji]: next };
    });
  }

  function handleSaveEdit() {
    if (!editContent.trim() || !onEdit) return;
    onEdit(message.id, editContent.trim());
    setIsEditing(false);
  }

  return (
    <div className={cn("group relative flex items-end gap-3 my-3 sm:my-3.5 transition-all animate-message-appear", own ? "justify-end" : "justify-start")}>
      {!own && (
        <Avatar className="size-9 shrink-0 border border-slate-700 shadow-md">
          <AvatarImage src={message.sender.avatar_url || undefined} alt={message.sender.display_name} />
          <AvatarFallback>{getInitials(message.sender.display_name)}</AvatarFallback>
        </Avatar>
      )}

      {/* Tuned max-width to ~70% */}
      <div className={cn("relative max-w-[76%] sm:max-w-[68%]", own && "items-end")}>
        {showSenderName && !own && (
          <p className="mb-1.5 px-2 text-xs font-semibold text-cyan-400">{message.sender.display_name}</p>
        )}

        {/* Elevated Bubble Box with Increased Radius & Padding */}
        <div
          className={cn(
            "relative rounded-3xl px-5 py-3.5 sm:px-6 sm:py-4 transition-all backdrop-blur-md",
            own
              ? "rounded-br-[6px] bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-500/10 border border-cyan-400/20"
              : "rounded-bl-[6px] border border-slate-800/80 bg-slate-900/90 text-slate-100 shadow-lg shadow-black/30"
          )}
        >
          {/* Content / Edit mode */}
          {isEditing ? (
            <div className="space-y-2.5 min-w-60">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="text-xs bg-slate-950 border-slate-700 text-white rounded-xl"
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <Button size="icon-sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="size-3.5" />
                </Button>
                <Button size="icon-sm" className="bg-cyan-500 text-slate-950 font-bold" onClick={handleSaveEdit}>
                  <Check className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {message.content && (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed sm:text-base sm:leading-relaxed font-normal">
                  {message.content}
                </p>
              )}
              {message.attachment_path && <AttachmentPreview message={message} />}
            </>
          )}

          {/* Time & Read Receipts */}
          <div
            className={cn(
              "mt-2 flex items-center justify-end gap-1 text-[10px] sm:text-xs",
              own ? "text-cyan-100/85 font-medium" : "text-slate-400 font-medium"
            )}
          >
            <time>{formatMessageTime(message.created_at)}</time>
            {message.edited_at && <span>· edited</span>}
            {own && showReceipt && (
              readBySomeoneElse ? (
                <CheckCheck className="size-3.5 sm:size-4 text-cyan-300" aria-label="Read" />
              ) : (
                <Check className="size-3.5 sm:size-4 text-cyan-200/70" aria-label="Sent" />
              )
            )}
          </div>

          {/* Reaction Pills below message */}
          {Object.entries(reactions).some(([_, users]) => users.length > 0) && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {Object.entries(reactions).map(([emoji, users]) => {
                if (!users.length) return null;
                const active = users.includes(currentUserId);
                return (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction(emoji)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all shadow-sm",
                      active
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
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

        {/* Hover Action Menu Bar (Reactions, Reply, Edit, Delete) */}
        <div
          className={cn(
            "absolute -top-4 z-10 hidden group-hover:flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/95 backdrop-blur-md p-1 shadow-xl",
            own ? "right-3" : "left-3"
          )}
        >
          {/* Reaction Picker Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition">
                <Smile className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="flex gap-1.5 p-1.5 bg-slate-900 border-slate-800 rounded-full w-auto min-w-0 shadow-2xl">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  className="grid size-8 place-items-center rounded-full text-lg hover:bg-slate-800 hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reply */}
          {onReply && (
            <button
              onClick={() => onReply(message)}
              title="Reply"
              className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition"
            >
              <CornerUpLeft className="size-3.5" />
            </button>
          )}

          {/* Edit (Own messages only) */}
          {own && onEdit && (
            <button
              onClick={() => setIsEditing(true)}
              title="Edit message"
              className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition"
            >
              <Pencil className="size-3.5" />
            </button>
          )}

          {/* Delete (Own messages only) */}
          {own && onDelete && (
            <button
              onClick={() => onDelete(message.id)}
              title="Delete message"
              className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
