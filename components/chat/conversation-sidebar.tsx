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

export function ConversationSidebar({ profile, conversations, selectedConversationId, onlineUserIds, query, onQueryChange, onConversationCreated }: ConversationSidebarProps) {
  return (
    <aside className="flex h-svh min-h-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20"><MessageCircleMore className="size-5" /></span>
        <div className="min-w-0 flex-1"><p className="font-semibold tracking-tight">ChatSphere</p><p className="text-xs text-muted-foreground">Messages & groups</p></div>
        <ThemeToggle />
        <NewChatDialog currentUserId={profile.id} onCreated={onConversationCreated} />
      </div>

      <div className="p-3">
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => onQueryChange(event.target.value)} className="border-sidebar-border bg-background/70 pl-9" placeholder="Search conversations" /></div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2">
        <div className="space-y-1 pb-3">
          {conversations.map((conversation) => {
            const title = getConversationTitle(conversation, profile.id);
            const peers = getConversationPeers(conversation, profile.id);
            const isOnline = conversation.type === "direct" && peers.some((peer) => onlineUserIds.has(peer.id));
            const lastMessage = conversation.last_message;
            const preview = lastMessage ? (lastMessage.message_type === "image" ? "📷 Image" : lastMessage.message_type === "file" ? "📎 File" : lastMessage.content) : "No messages yet";
            const active = selectedConversationId === conversation.id;

            return (
              <Link key={conversation.id} href={`/chat/${conversation.id}`} className={cn("group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-sidebar-accent", active && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                <div className="relative">
                  <ConversationAvatar conversation={conversation} userId={profile.id} />
                  {isOnline && <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-sidebar bg-emerald-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</p><time className="shrink-0 text-[11px] text-muted-foreground">{formatConversationTime(lastMessage?.created_at || conversation.updated_at)}</time></div>
                  <div className="mt-1 flex items-center gap-2"><p className={cn("min-w-0 flex-1 truncate text-xs text-muted-foreground", conversation.unread_count > 0 && "font-medium text-foreground")}>{preview}</p>{conversation.unread_count > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{conversation.unread_count > 99 ? "99+" : conversation.unread_count}</span>}</div>
                </div>
              </Link>
            );
          })}
          {!conversations.length && <div className="px-6 py-16 text-center"><MessageCircleMore className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-4 text-sm font-medium">No conversations found</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Start a new chat or try a different search.</p></div>}
        </div>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3"><UserMenu profile={profile} /></div>
    </aside>
  );
}
