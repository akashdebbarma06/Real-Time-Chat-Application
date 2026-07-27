"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  BellOff,
  Check,
  CheckCheck,
  MessageCircleMore,
  MoreVertical,
  Moon,
  Pin,
  PinOff,
  Radio,
  Search,
  Settings,
  Sun,
  UserPlus,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { ContactsView } from "@/components/chat/contacts-view";
import { ConversationAvatar } from "@/components/chat/conversation-avatar";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";
import { SettingsView } from "@/components/chat/settings-view";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { theme, setTheme } = useTheme();
  // Primary Tabs: chats | contacts | settings
  const [activeTab, setActiveTab] = useState<"chats" | "contacts" | "settings">("chats");

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
    <aside className="flex h-svh min-h-0 flex-col border-r bg-slate-950 text-slate-100">
      {/* Top Header App Home Bar with Title & 3-Dots Dropdown Menu */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4 shrink-0 bg-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
            <MessageCircleMore className="size-5" />
          </span>
          <span className="font-bold tracking-wider text-base uppercase bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Aether Chat
          </span>
        </div>

        {/* 3-Dots Dropdown Menu (Day/Night Mode & Create New Group) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="grid size-9 place-items-center rounded-xl border border-slate-700/60 bg-slate-800/50 text-slate-300 transition hover:bg-slate-700 hover:text-white">
              <MoreVertical className="size-5" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" side="bottom" className="w-64 bg-slate-900 border-slate-800 text-slate-200 shadow-2xl p-2 rounded-2xl">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50">
              <div className="flex items-center gap-2 text-xs font-medium">
                {theme === "dark" ? <Moon className="size-4 text-cyan-400" /> : <Sun className="size-4 text-amber-400" />}
                <span>Day / Night Mode</span>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>

            <DropdownMenuSeparator className="bg-slate-800 my-2" />

            <NewChatDialog currentUserId={profile.id} onCreated={onConversationCreated} triggerVariant="full" />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content Area based on Selected Primary Tab */}
      <div className="flex-1 min-h-0 relative">
        {/* 1. CHATS TAB */}
        {activeTab === "chats" && (
          <div className="flex h-full flex-col">
            {/* Search Input */}
            <div className="p-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  className="border-slate-800 bg-slate-900/80 text-slate-200 pl-9 rounded-2xl text-xs focus-visible:ring-cyan-500/50 placeholder:text-slate-500"
                  placeholder="Search conversations..."
                />
              </div>
            </div>

            {/* Chat Sub-Filters: Recent | Pinned | Archived */}
            <div className="px-3 pb-2">
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-900 p-1 text-xs font-medium border border-slate-800">
                <button
                  onClick={() => setChatFilter("recent")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
                    chatFilter === "recent"
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>Recent</span>
                </button>
                <button
                  onClick={() => setChatFilter("pinned")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
                    chatFilter === "pinned"
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Pin className="size-3" />
                  <span>Pinned ({pinnedIds.size})</span>
                </button>
                <button
                  onClick={() => setChatFilter("archived")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
                    chatFilter === "archived"
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Archive className="size-3" />
                  <span>Archived</span>
                </button>
              </div>
            </div>

            {/* Active Chats List */}
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-2 pb-4 pt-1">
                {filteredConversations.map((conversation) => {
                  const title = getConversationTitle(conversation, profile.id);
                  const peers = getConversationPeers(conversation, profile.id);
                  const isOnline = conversation.type === "direct" && peers.some((peer) => onlineUserIds.has(peer.id));
                  const lastMessage = conversation.last_message;
                  const ownLastMessage = lastMessage?.sender_id === profile.id;
                  const readBySomeoneElse = lastMessage?.read_receipts?.some((r: { user_id: string }) => r.user_id !== profile.id);

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
                        "group relative flex items-center gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 transition-all hover:bg-slate-800/80 hover:border-slate-700 shadow-sm",
                        active && "border-cyan-500/60 bg-slate-800/90 shadow-md ring-1 ring-cyan-500/30"
                      )}
                    >
                      {/* Avatar + Online Indicator */}
                      <div className="relative shrink-0">
                        <ConversationAvatar conversation={conversation} userId={profile.id} />
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-slate-950 bg-emerald-500 shadow-sm" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {/* Row 1: Title + Mute + Pin + Time */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-100">{title}</p>
                            {isPinned && <Pin className="size-3 text-cyan-400 shrink-0 rotate-45" />}
                          </div>
                          <time className="shrink-0 text-[11px] text-slate-400 font-medium">
                            {formatConversationTime(lastMessage?.created_at || conversation.updated_at)}
                          </time>
                        </div>

                        {/* Row 2: Message preview / Typing... + Read Checkmarks + Unread Count */}
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            {/* Read Status Checkmarks for Own Sent Messages */}
                            {ownLastMessage && (
                              <span className="shrink-0">
                                {readBySomeoneElse ? (
                                  <CheckCheck className="size-3.5 text-cyan-400" aria-label="Read" />
                                ) : (
                                  <Check className="size-3.5 text-slate-400" aria-label="Sent" />
                                )}
                              </span>
                            )}

                            <p
                              className={cn(
                                "min-w-0 flex-1 truncate text-xs text-slate-400",
                                conversation.unread_count > 0 && "font-semibold text-cyan-300"
                              )}
                            >
                              {preview}
                            </p>
                          </div>

                          {/* Unread Count Badge */}
                          {conversation.unread_count > 0 && (
                            <span className="grid min-w-5 place-items-center rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950 shadow-md">
                              {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hover Actions: Pin & Archive */}
                      <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-slate-950/90 backdrop-blur-md rounded-full border border-slate-800 p-1 shadow-md">
                        <button
                          onClick={(e) => togglePin(conversation.id, e)}
                          title={isPinned ? "Unpin chat" : "Pin chat"}
                          className="p-1 hover:text-cyan-400 transition-colors text-slate-400"
                        >
                          {isPinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
                        </button>
                        <button
                          onClick={(e) => toggleArchive(conversation.id, e)}
                          title={isArchived ? "Unarchive chat" : "Archive chat"}
                          className="p-1 hover:text-cyan-400 transition-colors text-slate-400"
                        >
                          {isArchived ? <ArchiveRestore className="size-3" /> : <Archive className="size-3" />}
                        </button>
                      </div>
                    </Link>
                  );
                })}

                {!filteredConversations.length && (
                  <div className="px-6 py-16 text-center">
                    <MessageCircleMore className="mx-auto size-8 text-slate-600" />
                    <p className="mt-4 text-sm font-medium text-slate-300">No {chatFilter} chats</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {chatFilter === "pinned"
                        ? "Hover on any chat to pin it."
                        : chatFilter === "archived"
                          ? "No archived conversations."
                          : "Start a new chat using the 3-dots menu above."}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
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

        {/* 3. SETTINGS TAB */}
        {activeTab === "settings" && <SettingsView profile={profile} />}
      </div>

      {/* Floating Bottom Navigation Bar (Footer) */}
      <div className="p-3 pt-1 shrink-0">
        <nav className="rounded-3xl border border-cyan-500/20 bg-slate-900/90 backdrop-blur-xl grid grid-cols-3 gap-1 p-1.5 shadow-2xl">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all ${
              activeTab === "chats"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <MessageCircleMore className="size-5" />
            <span className="text-[10px]">Chats</span>
          </button>

          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all ${
              activeTab === "contacts"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Users className="size-5" />
            <span className="text-[10px]">Contacts</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all ${
              activeTab === "settings"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Settings className="size-5" />
            <span className="text-[10px]">Settings</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
