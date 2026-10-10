"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import { useBackHandler } from "@/hooks/use-back-handler";
import type { ConversationMember, Profile } from "@/types/chat";

export interface ReactionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reactions: { [emoji: string]: string[] };
  currentUserId: string;
  currentUserProfile?: Profile | null;
  messageSender?: Profile | null;
  members?: ConversationMember[];
  onRemoveReaction: (emoji: string) => void;
}

export function ReactionDetailsDialog({
  open,
  onOpenChange,
  reactions,
  currentUserId,
  currentUserProfile,
  messageSender,
  members,
  onRemoveReaction,
}: ReactionDetailsDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Priority 1: Reaction Details Modal
  useBackHandler({
    id: "reaction-details-dialog",
    priority: 100,
    enabled: open,
    onBack: () => onOpenChange(false),
  });

  const reactionEntries = useMemo(
    () => Object.entries(reactions).filter(([, users]) => users.length > 0),
    [reactions]
  );

  const totalCount = useMemo(
    () => reactionEntries.reduce((sum, [, users]) => sum + users.length, 0),
    [reactionEntries]
  );

  // If selected emoji category is no longer present, reset to "all"
  const activeCategory = useMemo(() => {
    if (selectedCategory === "all") return "all";
    if (reactionEntries.some(([emoji]) => emoji === selectedCategory)) {
      return selectedCategory;
    }
    return "all";
  }, [selectedCategory, reactionEntries]);

  // Build resolved list of users for active category
  const reactionItems = useMemo(() => {
    const list: Array<{
      emoji: string;
      userId: string;
      profile?: Profile | null;
      isSelf: boolean;
    }> = [];

    const memberMap = new Map<string, Profile>();
    if (members) {
      for (const m of members) {
        if (m.profile) memberMap.set(m.user_id, m.profile);
      }
    }
    if (messageSender) {
      memberMap.set(messageSender.id, messageSender);
    }
    if (currentUserProfile) {
      memberMap.set(currentUserProfile.id, currentUserProfile);
    }

    for (const [emoji, userIds] of reactionEntries) {
      if (activeCategory !== "all" && activeCategory !== emoji) continue;

      for (const userId of userIds) {
        const isSelf = userId === currentUserId;
        const profile = memberMap.get(userId) || (isSelf ? currentUserProfile : null);
        list.push({
          emoji,
          userId,
          profile,
          isSelf,
        });
      }
    }

    // Sort: "You" at top, then alphabetically
    return list.sort((a, b) => {
      if (a.isSelf) return -1;
      if (b.isSelf) return 1;
      const nameA = a.profile?.display_name || "";
      const nameB = b.profile?.display_name || "";
      return nameA.localeCompare(nameB);
    });
  }, [reactionEntries, activeCategory, members, messageSender, currentUserProfile, currentUserId]);

  if (totalCount === 0 && open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full max-h-[80vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-2xl">
        {/* Top Header */}
        <DialogHeader className="px-5 py-4 border-b border-border/80 shrink-0">
          <DialogTitle className="text-base font-semibold text-foreground">
            {totalCount} {totalCount === 1 ? "reaction" : "reactions"}
          </DialogTitle>
        </DialogHeader>

        {/* Horizontal Category Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border/60 overflow-x-auto scrollbar-none shrink-0 bg-muted/20">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
              activeCategory === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}
          >
            All {totalCount}
          </button>
          {reactionEntries.map(([emoji, userIds]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setSelectedCategory(emoji)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                activeCategory === emoji
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              <span>{emoji}</span>
              <span>{userIds.length}</span>
            </button>
          ))}
        </div>

        {/* List of reacted users */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border/40 py-1">
          {reactionItems.map((item) => {
            const displayName = item.isSelf ? "You" : item.profile?.display_name || "Member";

            return (
              <div
                key={`${item.userId}-${item.emoji}`}
                onClick={() => {
                  if (item.isSelf) {
                    onRemoveReaction(item.emoji);
                    if (totalCount <= 1) {
                      onOpenChange(false);
                    }
                  }
                }}
                className={cn(
                  "flex items-center justify-between px-5 py-3 transition-colors",
                  item.isSelf ? "hover:bg-muted/60 cursor-pointer group" : ""
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-10 border border-border shrink-0">
                    <AvatarImage src={item.profile?.avatar_url || undefined} alt={displayName} />
                    <AvatarFallback className="text-xs font-semibold">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {displayName}
                    </p>
                    {item.isSelf && (
                      <p className="text-xs text-muted-foreground group-hover:text-destructive transition-colors">
                        Click to remove
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-xl shrink-0 pl-3">
                  {item.emoji}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
