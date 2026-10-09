"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Check,
  CheckCheck,
  CheckSquare,
  LogOut,
  Mail,
  MessageCircleMore,
  MessageSquarePlus,
  MoreVertical,
  Moon,
  Pin,
  PinOff,
  QrCode,
  Search,
  Settings,
  Star,
  Sun,
  Trash2,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { CallsView } from "@/components/chat/calls-view";
import { ContactsView } from "@/components/chat/contacts-view";
import { ConversationAvatar } from "@/components/chat/conversation-avatar";
import { ArchiveView } from "@/components/chat/archive-view";
import { MediaView } from "@/components/chat/media-view";
import { MobileBottomNav } from "@/components/chat/mobile-bottom-nav";
import { NewDirectChatDialog } from "@/components/chat/new-direct-chat-dialog";
import { NewGroupDialog } from "@/components/chat/new-group-dialog";
import { StarredMessagesDialog } from "@/components/chat/starred-messages-dialog";
import { ConfirmActionDialog } from "@/components/chat/confirm-action-dialog";
import { SettingsView } from "@/components/chat/settings-view";
import { StatusView } from "@/components/chat/status-view";
import type { RailTab } from "@/components/chat/navigation-rail";
import { Button } from "@/components/ui/button";
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
import { createClient } from "@/lib/supabase/client";
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
  activeTab?: RailTab;
  onTabChange?: (tab: RailTab) => void;
}

export function ConversationSidebar({
  profile,
  conversations,
  selectedConversationId,
  onlineUserIds,
  query,
  onQueryChange,
  onConversationCreated,
  activeTab: activeTabProp,
  onTabChange: onTabChangeProp,
}: ConversationSidebarProps) {
  const { theme, setTheme } = useTheme();

  const router = useRouter();

  // Internal tab state with fallback
  const [internalTab, setInternalTab] = useState<RailTab>("chats");
  const currentTab = activeTabProp ?? internalTab;
  const setTab = onTabChangeProp ?? setInternalTab;

  // Header Dialog states
  const [newDirectOpen, setNewDirectOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [starredOpen, setStarredOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Multi-selection "Select Chats" mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [confirmDeleteBatchOpen, setConfirmDeleteBatchOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Chat Filter Sub-tabs: all | unread | groups
  const [chatFilter, setChatFilter] = useState<"all" | "unread" | "groups">("all");

  // Pinned & Archived Conversation ID Sets
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined" || !profile?.id) return new Set();
    try {
      const raw = localStorage.getItem(`aether_pinned_${profile.id}`);
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  });

  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined" || !profile?.id) return new Set();
    try {
      const raw = localStorage.getItem(`aether_archived_${profile.id}`);
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  });

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
      try {
        localStorage.setItem(`aether_pinned_${profile.id}`, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  function toggleArchive(id: string, event?: React.MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setArchivedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(`aether_archived_${profile.id}`, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  function toggleSelectChat(id: string) {
    setSelectedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedChatIds.size === filteredConversations.length && filteredConversations.length > 0) {
      setSelectedChatIds(new Set());
    } else {
      setSelectedChatIds(new Set(filteredConversations.map((c) => c.id)));
    }
  }

  function handleBulkArchive() {
    if (selectedChatIds.size === 0) return;
    const count = selectedChatIds.size;
    setArchivedIds((prev) => {
      const next = new Set(prev);
      selectedChatIds.forEach((id) => next.add(id));
      try {
        localStorage.setItem(`aether_archived_${profile.id}`, JSON.stringify([...next]));
      } catch {}
      return next;
    });
    toast.success(`${count} chat${count > 1 ? "s" : ""} archived`);
    setSelectedChatIds(new Set());
    setIsSelectionMode(false);
  }

  async function handleBulkMarkUnread() {
    if (selectedChatIds.size === 0) return;
    const count = selectedChatIds.size;
    setBulkLoading(true);
    try {
      const supabase = createClient();
      for (const id of selectedChatIds) {
        await supabase
          .from("conversation_members")
          .update({ last_read_at: null, last_read_message_id: null })
          .match({ conversation_id: id, user_id: profile.id });
      }
      toast.success(`${count} chat${count > 1 ? "s" : ""} marked unread`);
      setSelectedChatIds(new Set());
      setIsSelectionMode(false);
      onConversationCreated();
    } catch {
      toast.error("Failed to mark unread");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedChatIds.size === 0) return;
    const count = selectedChatIds.size;
    setBulkLoading(true);
    try {
      const supabase = createClient();
      for (const id of selectedChatIds) {
        await supabase
          .from("conversation_members")
          .delete()
          .match({ conversation_id: id, user_id: profile.id });
      }
      if (selectedConversationId && selectedChatIds.has(selectedConversationId)) {
        router.push("/chat");
      }
      toast.success(`${count} conversation${count > 1 ? "s" : ""} deleted`);
      setSelectedChatIds(new Set());
      setIsSelectionMode(false);
      setConfirmDeleteBatchOpen(false);
      onConversationCreated();
    } catch {
      toast.error("Failed to delete conversations");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      setConfirmLogoutOpen(false);
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to log out");
    } finally {
      setLogoutLoading(false);
    }
  }

  const tabTitles: Record<string, string> = {
    chats: "Messages",
    calls: "Calls",
    status: "Status",
    archive: "Archived",
    media: "Shared Media",
    settings: "Settings",
  };

  const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <aside className="flex h-full min-h-0 flex-col border-r bg-background text-foreground">
      {/* Top Header */}
      {isSelectionMode ? (
        <div className="flex h-16 items-center justify-between border-b px-4 sm:px-5 shrink-0 bg-muted/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              {selectedChatIds.size === filteredConversations.length && filteredConversations.length > 0
                ? "Deselect All"
                : "Select All"}
            </button>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs font-bold text-foreground">
              {selectedChatIds.size} selected
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsSelectionMode(false);
              setSelectedChatIds(new Set());
            }}
            className="rounded-xl text-xs font-semibold hover:bg-muted"
          >
            Done
          </Button>
        </div>
      ) : (
        <div className="flex h-16 items-center justify-between border-b px-4 sm:px-5 shrink-0">
          <h1 className="text-xl font-bold tracking-tight">
            {tabTitles[currentTab] || "Messages"}
          </h1>

          <div className="flex items-center gap-1 -mr-1">
            {currentTab === "chats" && (
              <>
                {/* 1. New Conversation Button */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="New conversation"
                  title="New conversation"
                  onClick={() => setNewDirectOpen(true)}
                  className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                >
                  <MessageSquarePlus className="size-4" />
                </Button>

                {/* 2. Three-Dots Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="More options"
                      title="More options"
                      className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" side="bottom" className="w-56 p-1.5 rounded-2xl shadow-xl">
                    <DropdownMenuItem
                      onSelect={() => setNewGroupOpen(true)}
                      className="flex items-center gap-2.5 text-xs rounded-xl cursor-pointer p-2 hover:bg-muted font-medium"
                    >
                      <Users className="size-4 text-purple-600 dark:text-purple-400" />
                      <span>New Group</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={() => setStarredOpen(true)}
                      className="flex items-center gap-2.5 text-xs rounded-xl cursor-pointer p-2 hover:bg-muted font-medium"
                    >
                      <Star className="size-4 text-amber-500 fill-amber-500/20" />
                      <span>Starred Messages</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={() => {
                        setIsSelectionMode(true);
                        setSelectedChatIds(new Set());
                      }}
                      className="flex items-center gap-2.5 text-xs rounded-xl cursor-pointer p-2 hover:bg-muted font-medium"
                    >
                      <CheckSquare className="size-4 text-purple-600 dark:text-purple-400" />
                      <span>Select Chats</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem
                      onSelect={() => setConfirmLogoutOpen(true)}
                      className="flex items-center gap-2.5 text-xs rounded-xl cursor-pointer p-2 hover:bg-destructive/10 text-destructive font-medium"
                    >
                      <LogOut className="size-4" />
                      <span>Log Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area based on Selected Tab */}
      <div className="flex-1 min-h-0 relative">
        {/* 1. CHATS TAB */}
        {currentTab === "chats" && (
          <div className="flex h-full flex-col">
            {/* Filter Pill Tabs: All Chats | Unread | Groups */}
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
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                    chatFilter === "groups"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  Groups
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
                  className="border-border bg-muted/50 text-foreground pl-9 pr-8 rounded-xl text-xs focus-visible:ring-primary/50 placeholder:text-muted-foreground"
                  placeholder="Search conversations..."
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => onQueryChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
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
                      ? "📷 Photo"
                      : lastMessage.content
                    : "No messages yet";

                  const isSelected = conversation.id === selectedConversationId;
                  const isPinned = pinnedIds.has(conversation.id);
                  const isArchived = archivedIds.has(conversation.id);

                  const isSelectedInBatch = selectedChatIds.has(conversation.id);

                  if (isSelectionMode) {
                    return (
                      <div
                        key={conversation.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleSelectChat(conversation.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleSelectChat(conversation.id);
                          }
                        }}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-2xl p-3 transition-all cursor-pointer select-none",
                          isSelectedInBatch
                            ? "bg-purple-500/15 border border-purple-500/30 shadow-xs"
                            : "hover:bg-muted/60 text-foreground"
                        )}
                      >
                        {/* Checkbox */}
                        <div
                          className={cn(
                            "grid size-5 place-items-center rounded-md border text-white transition-colors shrink-0",
                            isSelectedInBatch
                              ? "bg-purple-600 border-purple-600"
                              : "border-muted-foreground/30 bg-background"
                          )}
                        >
                          {isSelectedInBatch && <Check className="size-3.5 stroke-[3]" />}
                        </div>

                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <ConversationAvatar
                            conversation={conversation}
                            userId={profile.id}
                          />
                          {isOnline && (
                            <span
                              aria-label="Online"
                              className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-emerald-500"
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-foreground leading-snug">{title}</p>
                            <time className="shrink-0 text-xs text-muted-foreground font-medium">
                              {formatConversationTime(lastMessage?.created_at || conversation.updated_at)}
                            </time>
                          </div>
                          <p className="truncate text-xs text-muted-foreground mt-1">
                            {preview}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={conversation.id}
                      href={`/chat/${conversation.id}`}
                      className={cn(
                        "group relative flex items-center gap-3.5 rounded-2xl p-3 transition-all",
                        isSelected
                          ? "bg-muted shadow-xs"
                          : "hover:bg-muted/60 text-foreground"
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <ConversationAvatar
                          conversation={conversation}
                          userId={profile.id}
                        />
                        {isOnline && (
                          <span
                            aria-label="Online"
                            className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-emerald-500"
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {/* Row 1: Title + Pin + Relative Time */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground leading-snug">{title}</p>
                            {isPinned && <Pin className="size-3 text-primary shrink-0 rotate-45" />}
                          </div>
                          <time className="shrink-0 text-xs text-muted-foreground font-medium">
                            {formatConversationTime(lastMessage?.created_at || conversation.updated_at)}
                          </time>
                        </div>

                        {/* Row 2: Activity subtitle + read checkmarks + unread badge */}
                        <div className="mt-1.5 flex items-center justify-between gap-2">
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

                          {conversation.unread_count > 0 && (
                            <span className="ml-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                              {conversation.unread_count}
                            </span>
                          )}
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

            {/* Bulk Actions Floating Toolbar */}
            {isSelectionMode && (
              <div className="border-t bg-card/95 backdrop-blur-md p-2.5 px-4 flex items-center justify-between gap-2 shadow-lg">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedChatIds.size === 0 || bulkLoading}
                  onClick={handleBulkArchive}
                  className="flex-1 rounded-xl text-xs font-medium gap-1.5 h-9"
                  title="Archive selected chats"
                >
                  <Archive className="size-3.5 text-purple-600" />
                  <span>Archive</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedChatIds.size === 0 || bulkLoading}
                  onClick={() => void handleBulkMarkUnread()}
                  className="flex-1 rounded-xl text-xs font-medium gap-1.5 h-9"
                  title="Mark selected as unread"
                >
                  <Mail className="size-3.5 text-purple-600" />
                  <span>Mark Unread</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedChatIds.size === 0 || bulkLoading}
                  onClick={() => setConfirmDeleteBatchOpen(true)}
                  className="flex-1 rounded-xl text-xs font-medium gap-1.5 h-9 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  title="Delete selected chats"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 2. CALLS TAB */}
        {currentTab === "calls" && (
          <CallsView
            conversations={conversations}
            profile={profile}
            onlineUserIds={onlineUserIds}
          />
        )}

        {/* 3. STATUS TAB */}
        {currentTab === "status" && (
          <StatusView
            profile={profile}
            conversations={conversations}
          />
        )}

        {/* 4. ARCHIVE TAB */}
        {currentTab === "archive" && (
          <ArchiveView
            conversations={conversations}
            profile={profile}
            archivedIds={archivedIds}
            onUnarchive={(id) => toggleArchive(id)}
            selectedConversationId={selectedConversationId}
          />
        )}

        {/* 5. MEDIA TAB */}
        {currentTab === "media" && (
          <MediaView
            conversations={conversations}
            profile={profile}
          />
        )}

        {/* 6. SETTINGS TAB */}
        {currentTab === "settings" && <SettingsView profile={profile} />}
      </div>

      {/* MOBILE ONLY: Compact Bottom Navigation Bar */}
      <div className="md:hidden">
        <MobileBottomNav
          activeTab={currentTab}
          onTabChange={setTab}
          unreadChatsCount={totalUnreadCount}
        />
      </div>

      {/* Action Dialogs */}
      <NewDirectChatDialog
        currentUserId={profile.id}
        open={newDirectOpen}
        onOpenChange={setNewDirectOpen}
        onCreated={onConversationCreated}
      />

      <NewGroupDialog
        currentUserId={profile.id}
        open={newGroupOpen}
        onOpenChange={setNewGroupOpen}
        onCreated={onConversationCreated}
      />

      <StarredMessagesDialog
        currentUserId={profile.id}
        open={starredOpen}
        onOpenChange={setStarredOpen}
      />

      <ConfirmActionDialog
        open={confirmLogoutOpen}
        onOpenChange={setConfirmLogoutOpen}
        title="Log Out"
        description="Are you sure you want to log out of Aether Chat? You will need to sign in again to access your conversations."
        confirmLabel="Log Out"
        variant="destructive"
        loading={logoutLoading}
        onConfirm={() => void handleLogout()}
      />

      <ConfirmActionDialog
        open={confirmDeleteBatchOpen}
        onOpenChange={setConfirmDeleteBatchOpen}
        title={`Delete ${selectedChatIds.size} chat${selectedChatIds.size > 1 ? "s" : ""} ?`}
        description="This will remove the selected conversations from your chat list. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={bulkLoading}
        onConfirm={() => void handleBulkDelete()}
      />

      <ComingSoonDialog
        open={comingSoonOpen}
        onOpenChange={setComingSoonOpen}
        featureName={comingSoonFeature}
      />
    </aside>
  );
}
