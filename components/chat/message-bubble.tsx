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
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  function toggleReaction(emoji: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    setReactions((prev) => {
      const current = prev[emoji] || [];
      const hasReacted = current.includes(currentUserId);
      const next = hasReacted
        ? current.filter((id) => id !== currentUserId)
        : [...current, currentUserId];
      return { ...prev, [emoji]: next };
    });
    setShowEmojiPicker(false);
  }

  function handleSaveEdit(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (!editContent.trim() || !onEdit) return;
    onEdit(message.id, editContent.trim());
    setIsEditing(false);
  }

  return (
    <div
      onClick={() => setShowMobileActions((prev) => !prev)}
      className={cn(
        "group relative flex items-end gap-3 my-3 sm:my-3.5 transition-all animate-message-appear select-none",
        own ? "justify-end" : "justify-start"
      )}
    >
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
              ? "rounded-br-[6px] bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-xl shadow-cyan-500/15 border border-cyan-400/30 font-medium"
              : "rounded-bl-[6px] border border-[#273147] bg-[#1B2234] text-slate-100 shadow-lg shadow-black/30"
          )}
        >
          {/* Content / Edit mode */}
          {isEditing ? (
            <div className="space-y-2.5 min-w-60" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="text-xs bg-slate-950 border-slate-700 text-white rounded-xl"
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <Button size="icon-sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}>
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
              own ? "text-slate-950/75 font-semibold" : "text-slate-400 font-medium"
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
            <div className="mt-2.5 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
              {Object.entries(reactions).map(([emoji, users]) => {
                if (!users.length) return null;
                const active = users.includes(currentUserId);
                return (
                  <button
                    key={emoji}
                    onClick={(e) => toggleReaction(emoji, e)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all shadow-sm active:scale-95",
                      active
                        ? "bg-cyan-500/25 border-cyan-400 text-cyan-300"
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

        {/* Hover & Touch Action Menu Bar (Reactions, Reply, Edit, Delete) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute -top-5 z-20 items-center gap-1 rounded-full border border-slate-800 bg-slate-950/95 backdrop-blur-md p-1 shadow-2xl transition-all",
            showMobileActions ? "flex" : "hidden group-hover:flex",
            own ? "right-3" : "left-3"
          )}
        >
          {/* Quick Reaction Bar (WhatsApp / iMessage Style) */}
          {showEmojiPicker ? (
            <div className="flex items-center gap-1.5 px-1 animate-in fade-in zoom-in duration-150">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => toggleReaction(emoji, e)}
                  className="grid size-8 place-items-center rounded-full text-lg hover:bg-slate-800 active:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
              <button
                onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(false); }}
                className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-slate-800"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <>
              {/* Smile Icon to Open Quick Emoji Bar */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(true); }}
                title="Add Reaction"
                className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition active:scale-95"
              >
                <Smile className="size-3.5" />
              </button>

              {/* Direct Quick Emojis (Top 3) */}
              {EMOJI_REACTIONS.slice(0, 3).map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => toggleReaction(emoji, e)}
                  className="grid size-7 place-items-center rounded-full text-sm hover:bg-slate-800 hover:scale-125 transition-transform active:scale-125"
                >
                  {emoji}
                </button>
              ))}

              {/* Reply */}
              {onReply && (
                <button
                  onClick={(e) => { e.stopPropagation(); onReply(message); }}
                  title="Reply"
                  className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition active:scale-95"
                >
                  <CornerUpLeft className="size-3.5" />
                </button>
              )}

              {/* Edit (Own messages only) */}
              {own && onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                  title="Edit message"
                  className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition active:scale-95"
                >
                  <Pencil className="size-3.5" />
                </button>
              )}

              {/* Delete (Own messages only) */}
              {own && onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(message.id); }}
                  title="Delete message"
                  className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition active:scale-95"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
