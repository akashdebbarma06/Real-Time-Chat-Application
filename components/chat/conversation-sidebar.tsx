"use client";

import Link from "next/link";
import { MessageCircleMore, Search } from "lucide-react";
import { ConversationAvatar } from "@/components/chat/conversation-avatar";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatConversationTime, getConversationPeers, getConversationTitle } from "@/lib/utils";
import type { ConversationSummary, Profile } from "@/types/chat";

interface ConversationSidebarProps {
  profile: Profile;
  conversations: ConversationSummary[];
  selectedConversationId?: string;
  onlineUserIds: Set<string>;
  query: string;
  onQueryChange: (query: string) => void;
  onConversationCreated: () => void;
}

export function ConversationSidebar({
  profile,
  conversations,
  selectedConversationId,
  onlineUserIds,
  query,
  onQueryChange,
  onConversationCreated,
}: ConversationSidebarProps) {
  return (
    <aside className="flex h-svh min-h-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Header: Logo on Left, Account & Settings (UserMenu) on Top Right */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <MessageCircleMore className="size-5" />
          </span>
          <span className="font-semibold tracking-tight text-base">ChatSphere</span>
        </div>

        {/* Account & Settings Top Right */}
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <UserMenu profile={profile} />
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="border-sidebar-border bg-background/70 pl-9 rounded-xl"
            placeholder="Search conversations"
          />
        </div>
      </div>

      {/* Conversation List: Highlighted Gray Boxes */}
      <ScrollArea className="min-h-0 flex-1 px-3">
        <div className="space-y-2 pb-4 pt-1">
          {conversations.map((conversation) => {
            const title = getConversationTitle(conversation, profile.id);
            const peers = getConversationPeers(conversation, profile.id);
            const isOnline = conversation.type === "direct" && peers.some((peer) => onlineUserIds.has(peer.id));
            const lastMessage = conversation.last_message;
            const preview = lastMessage
              ? lastMessage.message_type === "image"
                ? "📷 Image"
                : lastMessage.message_type === "file"
                  ? "📎 File"
                  : lastMessage.content
              : "No messages yet";
            const active = selectedConversationId === conversation.id;

            return (
              <Link
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                className={cn(
                  "group flex items-center gap-3.5 rounded-2xl border border-sidebar-border/60 bg-muted/40 p-3.5 transition-all hover:bg-muted/80 hover:border-sidebar-border hover:shadow-sm",
                  active && "border-primary/50 bg-muted/90 shadow-sm ring-1 ring-primary/30"
                )}
              >
                <div className="relative shrink-0">
                  <ConversationAvatar conversation={conversation} userId={profile.id} />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-sidebar bg-emerald-500 shadow-sm" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{title}</p>
                    <time className="shrink-0 text-[11px] text-muted-foreground">
                      {formatConversationTime(lastMessage?.created_at || conversation.updated_at)}
                    </time>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <p
                      className={cn(
                        "min-w-0 flex-1 truncate text-xs text-muted-foreground",
                        conversation.unread_count > 0 && "font-semibold text-foreground"
                      )}
                    >
                      {preview}
                    </p>
                    {conversation.unread_count > 0 && (
                      <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
                        {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          {!conversations.length && (
            <div className="px-6 py-16 text-center">
              <MessageCircleMore className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-4 text-sm font-medium">No conversations found</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Start a new chat using the button below.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Left Panel: New Chat Option */}
      <div className="border-t border-sidebar-border p-3">
        <NewChatDialog currentUserId={profile.id} onCreated={onConversationCreated} triggerVariant="full" />
      </div>
    </aside>
  );
}
