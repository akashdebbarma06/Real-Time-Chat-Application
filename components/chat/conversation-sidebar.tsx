"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  Check,
  CheckCheck,
  MessageCircleMore,
  MoreVertical,
  Moon,
  Pin,
  PinOff,
  QrCode,
  Search,
  Settings,
  Sun,
  Users,
  UsersRound,
} from "lucide-react";
import { useTheme } from "next-themes";
import { ContactsView } from "@/components/chat/contacts-view";
import { ConversationAvatar } from "@/components/chat/conversation-avatar";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";
import { SettingsView } from "@/components/chat/settings-view";
import { ComingSoonDialog } from "@/components/ui/coming-soon-dialog";
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

  // Chat Filter Sub-tabs: all | unread | groups
  const [chatFilter, setChatFilter] = useState<"all" | "unread" | "groups">("all");

  // Pinned & Archived Conversation ID Sets
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

  // Coming Soon Dialog state
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState("Feature");

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const isArchived = archivedIds.has(conversation.id);

      if (chatFilter === "unread") return conversation.unread_count > 0 && !isArchived;
      if (chatFilter === "groups") return conversation.type === "group" && !isArchived;
      return !isArchived;
    });
  }, [archivedIds, chatFilter, conversations]);

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
    <aside className="flex h-svh min-h-0 flex-col border-r bg-background text-foreground">
      {/* Top Header */}
      <div className="flex h-16 items-center justify-between border-b px-5 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Activity</h1>

        {/* 3-Dots Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="grid size-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground">
              <MoreVertical className="size-5" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" side="bottom" className="w-64 p-2 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 text-xs font-medium">
                {theme === "dark" ? <Moon className="size-4 text-primary" /> : <Sun className="size-4 text-amber-400" />}
                <span>Day / Night Mode</span>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
              onClick={() => {
                setComingSoonFeature("My QR Code & Contact Share");
                setComingSoonOpen(true);
              }}
              className="flex items-center gap-2 text-xs rounded-xl cursor-pointer p-2.5"
            >
              <QrCode className="size-4 text-primary" />
              <span>My QR Code</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            <NewChatDialog currentUserId={profile.id} onCreated={onConversationCreated} triggerVariant="full" />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content Area based on Selected Primary Tab */}
      <div className="flex-1 min-h-0 relative">
        {/* 1. CHATS TAB */}
        {activeTab === "chats" && (
          <div className="flex h-full flex-col">
            {/* Filter Pill Tabs: All Chats | Unread | groups */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChatFilter("all")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                    chatFilter === "all"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  All Chats
                </button>
                <button
                  onClick={() => setChatFilter("unread")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                    chatFilter === "unread"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  Unread
                </button>
                <button
                  onClick={() => setChatFilter("groups")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-all lowercase",
                    chatFilter === "groups"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  groups
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="px-5 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  className="border-border bg-muted/50 text-foreground pl-9 rounded-xl text-xs focus-visible:ring-primary/50 placeholder:text-muted-foreground"
                  placeholder="Search conversations..."
                />
              </div>
            </div>

            {/* Active Chats List */}
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-1 pb-4 pt-1">
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
                        "group relative flex items-center gap-3.5 rounded-2xl p-3 transition-all hover:bg-muted/60",
                        active && "bg-muted/80"
                      )}
                    >
                      {/* Avatar + Notification Dot */}
                      <div className="relative shrink-0">
                        <ConversationAvatar conversation={conversation} userId={profile.id} />
                        {/* Red notification dot for unread */}
                        {conversation.unread_count > 0 && (
                          <span className="absolute -left-0.5 top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-rose-500 border-2 border-background" />
                        )}
                        {/* Online indicator */}
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-emerald-500 shadow-sm" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {/* Row 1: Title + Pin + Relative Time */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                            {isPinned && <Pin className="size-3 text-primary shrink-0 rotate-45" />}
                          </div>
                          <time className="shrink-0 text-xs text-muted-foreground font-medium">
                            {formatConversationTime(lastMessage?.created_at || conversation.updated_at)}
                          </time>
                        </div>

                        {/* Row 2: Activity subtitle + read checkmarks */}
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            {/* Read Status Checkmarks for Own Sent Messages */}
                            {ownLastMessage && (
                              <span className="shrink-0">
                                {readBySomeoneElse ? (
                                  <CheckCheck className="size-3.5 text-primary" aria-label="Read" />
                                ) : (
                                  <Check className="size-3.5 text-muted-foreground" aria-label="Sent" />
                                )}
                              </span>
                            )}

                            <p
                              className={cn(
                                "min-w-0 flex-1 truncate text-xs text-muted-foreground",
                                conversation.unread_count > 0 && "font-semibold text-foreground"
                              )}
                            >
                              {preview}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Hover Actions: Pin & Archive */}
                      <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-background/90 backdrop-blur-md rounded-full border p-1 shadow-md">
                        <button
                          onClick={(e) => togglePin(conversation.id, e)}
                          title={isPinned ? "Unpin chat" : "Pin chat"}
                          className="p-1 hover:text-primary transition-colors text-muted-foreground"
                        >
                          {isPinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
                        </button>
                        <button
                          onClick={(e) => toggleArchive(conversation.id, e)}
                          title={isArchived ? "Unarchive chat" : "Archive chat"}
                          className="p-1 hover:text-primary transition-colors text-muted-foreground"
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
                    <p className="mt-4 text-sm font-medium text-foreground">No {chatFilter === "all" ? "recent" : chatFilter} chats</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {chatFilter === "unread"
                        ? "You're all caught up!"
                        : chatFilter === "groups"
                          ? "No group conversations yet."
                          : "Start a new chat using the menu above."}
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

      {/* Bottom Navigation Bar */}
      <div className="border-t shrink-0">
        <nav className="grid grid-cols-4 py-1">
          <button
            onClick={() => setActiveTab("chats")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2.5 transition-all text-xs",
              activeTab === "chats"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageCircleMore className="size-5" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => {
              setComingSoonFeature("Status Updates");
              setComingSoonOpen(true);
            }}
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-muted-foreground hover:text-foreground transition-all"
          >
            <UsersRound className="size-5" />
            <span className="text-[10px]">Status</span>
          </button>

          <button
            onClick={() => setActiveTab("contacts")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2.5 transition-all text-xs",
              activeTab === "contacts"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="size-5" />
            <span className="text-[10px]">Contacts</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2.5 transition-all text-xs",
              activeTab === "settings"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Settings className="size-5" />
            <span className="text-[10px]">Account</span>
          </button>
        </nav>
      </div>

      <ComingSoonDialog
        open={comingSoonOpen}
        onOpenChange={setComingSoonOpen}
        featureName={comingSoonFeature}
      />
    </aside>
  );
}
