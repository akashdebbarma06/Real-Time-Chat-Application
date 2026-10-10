"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Ban,
  BellOff,
  BellRing,
  Heart,
  ListPlus,
  LogOut,
  MessageSquare,
  Pin,
  PinOff,
  Trash2,
  XCircle,
} from "lucide-react";
import type { ConversationSummary } from "@/types/chat";
import { cn } from "@/lib/utils";

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ConversationContextMenuProps {
  conversation: ConversationSummary;
  position: ContextMenuPosition;
  isOpen: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isMuted?: boolean;
  isFavourite?: boolean;
  onClose: () => void;
  onToggleArchive: (conversationId: string) => void;
  onToggleMute: (conversationId: string) => void;
  onTogglePin: (conversationId: string) => void;
  onToggleUnread: (conversationId: string) => void;
  onToggleFavourite: (conversationId: string) => void;
  onAddToList: (conversationId: string) => void;
  onClearChat: (conversationId: string) => void;
  onExitGroup?: (conversationId: string) => void;
  onBlockContact?: (conversationId: string) => void;
  onDeleteChat?: (conversationId: string) => void;
}

export function ConversationContextMenu({
  conversation,
  position,
  isOpen,
  isPinned,
  isArchived,
  isMuted = false,
  isFavourite = false,
  onClose,
  onToggleArchive,
  onToggleMute,
  onTogglePin,
  onToggleUnread,
  onToggleFavourite,
  onAddToList,
  onClearChat,
  onExitGroup,
  onBlockContact,
  onDeleteChat,
}: ConversationContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x: position.x, y: position.y });

  const isGroup = conversation.type === "group";

  // Reposition inside viewport bounds
  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const padding = 12;

    let nextX = position.x;
    let nextY = position.y;

    if (nextX + rect.width > window.innerWidth - padding) {
      nextX = window.innerWidth - rect.width - padding;
    }
    if (nextX < padding) {
      nextX = padding;
    }

    if (nextY + rect.height > window.innerHeight - padding) {
      nextY = window.innerHeight - rect.height - padding;
    }
    if (nextY < padding) {
      nextY = padding;
    }

    setAdjustedPos({ x: nextX, y: nextY });
  }, [isOpen, position.x, position.y]);

  // Core Behavior: Close on outside click or scroll or escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    function handleScroll() {
      onClose();
    }

    function handlePointerDown(e: PointerEvent | MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("mousedown", handlePointerDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("mousedown", handlePointerDown, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible overlay for outside clicks */}
      <div
        className="fixed inset-0 z-[9998] cursor-default bg-transparent"
        onClick={onClose}
        onPointerDown={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      {/* WhatsApp Web Themed Popup Menu with dynamic tokens */}
      <div
        ref={menuRef}
        role="menu"
        aria-label="Chat options"
        style={{
          left: `${adjustedPos.x}px`,
          top: `${adjustedPos.y}px`,
        }}
        className="fixed z-[9999] min-w-[210px] w-max rounded-2xl border border-border bg-popover/95 py-2 text-popover-foreground shadow-2xl shadow-black/20 backdrop-blur-xl transition-opacity animate-in fade-in zoom-in-95 duration-100 select-none"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* 1. Archive / Unarchive */}
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onToggleArchive(conversation.id);
            onClose();
          }}
          className="flex w-full items-center gap-3.5 px-4 sm:px-5 py-2.5 text-left text-[14px] text-popover-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          {isArchived ? (
            <ArchiveRestore className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <Archive className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span>{isArchived ? "Unarchive chat" : "Archive chat"}</span>
        </button>

        {/* 2. Mute notifications */}
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onToggleMute(conversation.id);
            onClose();
          }}
          className="flex w-full items-center gap-3.5 px-4 sm:px-5 py-2.5 text-left text-[14px] text-popover-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          {isMuted ? (
            <BellRing className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <BellOff className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span>{isMuted ? "Unmute notifications" : "Mute notifications"}</span>
        </button>

        {/* 3. Pin / Unpin chat */}
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onTogglePin(conversation.id);
            onClose();
          }}
          className="flex w-full items-center gap-3.5 px-4 sm:px-5 py-2.5 text-left text-[14px] text-popover-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          {isPinned ? (
            <PinOff className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <Pin className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span>{isPinned ? "Unpin chat" : "Pin chat"}</span>
        </button>

        {/* 4. Mark as unread / Mark as read */}
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onToggleUnread(conversation.id);
            onClose();
          }}
          className="flex w-full items-center gap-3.5 px-4 sm:px-5 py-2.5 text-left text-[14px] text-popover-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
          <span>{conversation.unread_count > 0 ? "Mark as read" : "Mark as unread"}</span>
        </button>

        {/* 5. Add to favourites / Remove from favourites */}
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onToggleFavourite(conversation.id);
            onClose();
          }}
          className="flex w-full items-center gap-3.5 px-4 sm:px-5 py-2.5 text-left text-[14px] text-popover-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Heart className={cn("size-4 shrink-0", isFavourite ? "fill-primary text-primary" : "text-muted-foreground")} />
          <span>{isFavourite ? "Remove from favourites" : "Add to favourites"}</span>
        </button>

        {/* 6. Add to list */}
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onAddToList(conversation.id);
            onClose();
          }}
          className="flex w-full items-center gap-3.5 px-4 sm:px-5 py-2.5 text-left text-[14px] text-popover-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <ListPlus className="size-4 shrink-0 text-muted-foreground" />
          <span>Add to list</span>
        </button>

        {/* Separator */}
        <div className="my-1 border-t border-border" />

        {/* ─── DYNAMIC OPTIONS: 1-on-1 vs Groups ─── */}
        {!isGroup && (
          /* 7. Block (1-on-1 Chats only) */
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onBlockContact?.(conversation.id);
              onClose();
            }}
            className="flex w-full items-center gap-3.5 px-4 sm:px-5 py-2.5 text-left text-[14px] text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
          >
            <Ban className="size-4 shrink-0 text-destructive" />
            <span>Block</span>
          </button>
        )}

        {/* 8. Clear chat */}
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClearChat(conversation.id);
            onClose();
          }}
          className="flex w-full items-center gap-3.5 px-4 sm:px-5 py-2.5 text-left text-[14px] text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
        >
          <XCircle className="size-4 shrink-0 text-destructive" />
          <span>Clear chat</span>
        </button>

        {isGroup ? (
          /* Exit group (Groups only) */
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onExitGroup?.(conversation.id);
              onClose();
            }}
            className="flex w-full items-center gap-3.5 px-4 sm:px-5 py-2.5 text-left text-[14px] text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
          >
            <LogOut className="size-4 shrink-0 text-destructive" />
            <span>Exit group</span>
          </button>
        ) : (
          /* Delete chat (1-on-1 Chats only) */
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onDeleteChat?.(conversation.id);
              onClose();
            }}
            className="flex w-full items-center gap-3.5 px-4 sm:px-5 py-2.5 text-left text-[14px] text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
          >
            <Trash2 className="size-4 shrink-0 text-destructive" />
            <span>Delete chat</span>
          </button>
        )}
      </div>
    </>
  );
}
