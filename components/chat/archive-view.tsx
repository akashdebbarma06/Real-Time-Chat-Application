"use client";

import Link from "next/link";
import { Archive, ArchiveRestore, MessageCircleMore, Search } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatConversationTime, getConversationPeers, getConversationTitle, getInitials } from "@/lib/utils";
import type { ConversationSummary, Profile } from "@/types/chat";

interface ArchiveViewProps {
  conversations: ConversationSummary[];
  profile: Profile;
  archivedIds: Set<string>;
  onUnarchive: (conversationId: string) => void;
  selectedConversationId?: string;
}

export function ArchiveView({
  conversations,
  profile,
  archivedIds,
  onUnarchive,
  selectedConversationId,
}: ArchiveViewProps) {
  const [query, setQuery] = useState("");

  const archivedConversations = conversations
    .filter((c) => archivedIds.has(c.id))
    .filter((c) => {
      if (!query.trim()) return true;
      const title = getConversationTitle(c, profile.id).toLowerCase();
      return title.includes(query.toLowerCase());
    });

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Archived Chats</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20">
            {archivedConversations.length} Archived
          </span>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search archived conversations..."
            className="pl-9 rounded-xl text-xs bg-muted/40 border-border"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 mt-2">
        <div className="space-y-1 py-1">
          {archivedConversations.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted/60 text-muted-foreground mb-3">
                <Archive className="size-6" />
              </div>
              <p className="font-semibold text-foreground text-sm">No archived chats</p>
              <p className="text-[11px] mt-1 text-muted-foreground max-w-xs mx-auto">
                Hover over any chat in your main list and click the archive button to move it here.
              </p>
            </div>
          ) : (
            archivedConversations.map((conversation) => {
              const title = getConversationTitle(conversation, profile.id);
              const isSelected = conversation.id === selectedConversationId;

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative flex items-center justify-between gap-3 rounded-2xl p-3 transition-all",
                    isSelected ? "bg-muted shadow-xs" : "hover:bg-muted/60"
                  )}
                >
                  <Link href={`/chat/${conversation.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="size-11 border border-border">
                      <AvatarImage src={conversation.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{getInitials(title)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {conversation.last_message?.content || "Conversation archived"}
                      </p>
                    </div>
                  </Link>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onUnarchive(conversation.id)}
                    title="Unarchive Conversation"
                    aria-label={`Unarchive ${title}`}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <ArchiveRestore className="size-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
