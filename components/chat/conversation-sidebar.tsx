"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  MessageCircleMore,
  PhoneCall,
  Pin,
  PinOff,
  Radio,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { ContactsView } from "@/components/chat/contacts-view";
import { ConversationAvatar } from "@/components/chat/conversation-avatar";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";
import { SettingsView } from "@/components/chat/settings-view";
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
  // Primary Tabs: chats | contacts | calls | settings
  const [activeTab, setActiveTab] = useState<"chats" | "contacts" | "calls" | "settings">("chats");

  // Chat Filter Sub-tabs: recent | pinned | archived
  const [chatFilter, setChatFilter] = useState<"recent" | "pinned" | "archived">("recent");

  // Pinned & Archived Conversation ID Sets
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const isPinned = pinnedIds.has(conversation.id);
      const isArchived = archivedIds.has(conversation.id);

      if (chatFilter === "pinned") return isPinned && !isArchived;
      if (chatFilter === "archived") return isArchived;
      // Recent (default): exclude archived
      return !isArchived;
    });
  }, [archivedIds, chatFilter, conversations, pinnedIds]);

  function togglePin(id: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleArchive(id: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setArchivedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <aside className="flex h-svh min-h-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Top Header Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <MessageCircleMore className="size-5" />
          </span>
          <div>
            <span className="font-semibold tracking-tight text-base block leading-none">ChatSphere</span>
            <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
              {activeTab}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area based on Primary Tab */}
      <div className="flex-1 min-h-0 relative">
        {/* 1. CHATS TAB */}
        {activeTab === "chats" && (
          <div className="flex h-full flex-col">
            {/* Chat Sub-Filters: Recent | Pinned | Archived */}
            <div className="p-3 pb-0">
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1 text-xs font-medium">
                <button
                  onClick={() => setChatFilter("recent")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
                    chatFilter === "recent"
                      ? "bg-background font-semibold text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Recent</span>
                </button>
                <button
                  onClick={() => setChatFilter("pinned")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
                    chatFilter === "pinned"
                      ? "bg-background font-semibold text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Pin className="size-3" />
                  <span>Pinned ({pinnedIds.size})</span>
                </button>
                <button
                  onClick={() => setChatFilter("archived")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
                    chatFilter === "archived"
                      ? "bg-background font-semibold text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Archive className="size-3" />
                  <span>Archived</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  className="border-sidebar-border bg-background/70 pl-9 rounded-xl text-xs"
                  placeholder="Search chats & messages..."
                />
              </div>
            </div>

            {/* Conversation Items List (Highlighted Gray Boxes) */}
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-2 pb-4 pt-1">
                {filteredConversations.map((conversation) => {
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
                  const isPinned = pinnedIds.has(conversation.id);
                  const isArchived = archivedIds.has(conversation.id);

                  return (
                    <Link
                      key={conversation.id}
                      href={`/chat/${conversation.id}`}
                      className={cn(
                        "group relative flex items-center gap-3.5 rounded-2xl border border-sidebar-border/60 bg-muted/40 p-3.5 transition-all hover:bg-muted/80 hover:border-sidebar-border hover:shadow-sm",
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
                          {isPinned && <Pin className="size-3 text-primary shrink-0" />}
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

                      {/* Hover Actions: Pin & Archive */}
                      <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-background/90 backdrop-blur-md rounded-full border p-1 shadow-sm">
                        <button
                          onClick={(e) => togglePin(conversation.id, e)}
                          title={isPinned ? "Unpin chat" : "Pin chat"}
                          className="p-1 hover:text-primary transition-colors"
                        >
                          {isPinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
                        </button>
                        <button
                          onClick={(e) => toggleArchive(conversation.id, e)}
                          title={isArchived ? "Unarchive chat" : "Archive chat"}
                          className="p-1 hover:text-primary transition-colors"
                        >
                          {isArchived ? <ArchiveRestore className="size-3" /> : <Archive className="size-3" />}
                        </button>
                      </div>
                    </Link>
                  );
                })}

                {!filteredConversations.length && (
                  <div className="px-6 py-16 text-center">
                    <MessageCircleMore className="mx-auto size-8 text-muted-foreground/50" />
                    <p className="mt-4 text-sm font-medium">No {chatFilter} chats</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {chatFilter === "pinned"
                        ? "Hover on any chat to pin it."
                        : chatFilter === "archived"
                          ? "No archived conversations."
                          : "Start a new chat using the button below."}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Bottom Left Panel: New Chat Option */}
            <div className="border-t border-sidebar-border p-3">
              <NewChatDialog currentUserId={profile.id} onCreated={onConversationCreated} triggerVariant="full" />
            </div>
          </div>
        )}

        {/* 2. CONTACTS TAB */}
        {activeTab === "contacts" && (
          <ContactsView
            currentUserId={profile.id}
            onlineUserIds={onlineUserIds}
            onConversationCreated={onConversationCreated}
          />
        )}

        {/* 3. CALLS TAB */}
        {activeTab === "calls" && (
          <div className="flex h-full flex-col justify-center items-center p-6 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary mb-4">
              <Radio className="size-7 animate-pulse" />
            </div>
            <h3 className="text-base font-semibold">Calls & Realtime Audio</h3>
            <p className="mt-2 text-xs text-muted-foreground max-w-xs leading-relaxed">
              Start direct messages or group chats to engage in live conversations with your friends.
            </p>
          </div>
        )}

        {/* 4. SETTINGS TAB */}
        {activeTab === "settings" && <SettingsView profile={profile} />}
      </div>

      {/* Primary 4-Tab Bottom Navigation Bar (Chats, Contacts, Calls, Settings) */}
      <nav className="border-t border-sidebar-border bg-background/95 backdrop-blur-md grid grid-cols-4 gap-1 p-1.5 shrink-0">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition-all ${
            activeTab === "chats"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <MessageCircleMore className="size-5" />
          <span className="text-[10px]">Chats</span>
        </button>

        <button
          onClick={() => setActiveTab("contacts")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition-all ${
            activeTab === "contacts"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Users className="size-5" />
          <span className="text-[10px]">Contacts</span>
        </button>

        <button
          onClick={() => setActiveTab("calls")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition-all ${
            activeTab === "calls"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <PhoneCall className="size-5" />
          <span className="text-[10px]">Calls</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition-all ${
            activeTab === "settings"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Settings className="size-5" />
          <span className="text-[10px]">Settings</span>
        </button>
      </nav>
    </aside>
  );
}
