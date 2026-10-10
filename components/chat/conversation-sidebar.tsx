"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  BellOff,
  Check,
  CheckCheck,
  CheckSquare,
  ChevronDown,
  Heart,
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
import { ConversationContextMenu } from "@/components/chat/conversation-context-menu";
import { getMockConversations } from "@/lib/mock-chats";
import { toast } from "@/lib/toast";
import { useTheme } from "next-themes";
import { CallsView } from "@/components/chat/calls-view";
import { ContactsView } from "@/components/chat/contacts-view";
import { ConversationAvatar } from "@/components/chat/conversation-avatar";
import { ArchiveView } from "@/components/chat/archive-view";
import { VaultView } from "@/components/chat/vault-view";
import { MobileBottomNav } from "@/components/chat/mobile-bottom-nav";
import { NewDirectChatDialog } from "@/components/chat/new-direct-chat-dialog";
import { NewGroupDialog } from "@/components/chat/new-group-dialog";
import { StarredMessagesDialog } from "@/components/chat/starred-messages-dialog";
import { ConfirmActionDialog } from "@/components/chat/confirm-action-dialog";
import { SettingsView } from "@/components/chat/settings-view";
import { StatusView } from "@/components/chat/status-view";
import { InPanelDirectChat } from "@/components/chat/in-panel-direct-chat";
import { InPanelNewGroup } from "@/components/chat/in-panel-new-group";
import { InPanelStarredMessages } from "@/components/chat/in-panel-starred-messages";
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

  // Track active settings sub-section to hide floating nav on sub-pages
  const [settingsSection, setSettingsSection] = useState<string | null>(null);

  const handleTabChange = (tab: RailTab) => {
    setSettingsSection(null);
    setTab(tab);
  };

  // In-panel subviews for chats tab: "chats" | "new-direct" | "new-group" | "starred"
  const [sidebarView, setSidebarView] = useState<"chats" | "new-direct" | "new-group" | "starred">("chats");

  useEffect(() => {
    if (currentTab !== "chats") {
      setSidebarView("chats");
    }
  }, [currentTab]);

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

  // Muted & Favourites ID Sets
  const [mutedIds, setMutedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined" || !profile?.id) return new Set();
    try {
      const raw = localStorage.getItem(`aether_muted_${profile.id}`);
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  });

  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined" || !profile?.id) return new Set();
    try {
      const raw = localStorage.getItem(`aether_favourites_${profile.id}`);
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  });

  // Custom Options Popup Menu State
  const [contextMenu, setContextMenu] = useState<{
    conversation: ConversationSummary;
    position: { x: number; y: number };
  } | null>(null);

  // Mobile Touch Long-Press (500ms) Refs
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const longPressFiredRef = useRef(false);

  // Coming Soon Dialog state
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState("Feature");

  // Merge real conversations with rich mock data containing both groups & 1-on-1 chats
  const allConversations = useMemo(() => {
    const mockList = getMockConversations(profile.id);
    if (!conversations || conversations.length === 0) {
      return mockList;
    }
    const existingIds = new Set(conversations.map((c) => c.id));
    const supplementary = mockList.filter((m) => !existingIds.has(m.id));
    return [...conversations, ...supplementary];
  }, [conversations, profile.id]);

  const filteredConversations = useMemo(() => {
    return allConversations.filter((conversation) => {
      const isArchived = archivedIds.has(conversation.id);

      if (chatFilter === "unread") return conversation.unread_count > 0 && !isArchived;
      if (chatFilter === "groups") return conversation.type === "group" && !isArchived;
      return !isArchived;
    });
  }, [allConversations, archivedIds, chatFilter]);

  function togglePin(id: string, event?: React.MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
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

  function toggleMute(id: string) {
    setMutedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(`aether_muted_${profile.id}`, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  function toggleFavourite(id: string) {
    setFavouriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(`aether_favourites_${profile.id}`, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  function toggleUnread(id: string) {
    const conv = allConversations.find((c) => c.id === id);
    if (conv) {
      conv.unread_count = conv.unread_count > 0 ? 0 : 1;
      onConversationCreated();
    }
  }

  function handleClearChat(id: string) {
    const conv = allConversations.find((c) => c.id === id);
    if (conv) {
      conv.last_message = null;
      onConversationCreated();
    }
  }

  function handleExitGroup(id: string) {
    toggleArchive(id);
  }

  function handleBlockContact(id: string) {
    try {
      const stored = localStorage.getItem(`aether_blocked_${profile.id}`);
      const blocked = stored ? new Set(JSON.parse(stored)) : new Set();
      blocked.add(id);
      localStorage.setItem(`aether_blocked_${profile.id}`, JSON.stringify([...blocked]));
    } catch {}
  }

  function handleDeleteChat(id: string) {
    toggleArchive(id);
  }

  function handleAddToList(id: string) {
    setComingSoonFeature("Add to Custom List");
    setComingSoonOpen(true);
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

  // In-Panel subview rendering for chats tab
  if (currentTab === "chats" && sidebarView === "new-direct") {
    return (
      <aside className="sidebar flex h-full min-h-0 w-full flex-col border-r bg-background text-foreground shrink-0 overflow-hidden min-w-0">
        <InPanelDirectChat
          currentUserId={profile.id}
          onBack={() => setSidebarView("chats")}
          onCreated={onConversationCreated}
        />
      </aside>
    );
  }

  if (currentTab === "chats" && sidebarView === "new-group") {
    return (
      <aside className="sidebar flex h-full min-h-0 w-full flex-col border-r bg-background text-foreground shrink-0 overflow-hidden min-w-0">
        <InPanelNewGroup
          currentUserId={profile.id}
          onBack={() => setSidebarView("chats")}
          onCreated={onConversationCreated}
        />
      </aside>
    );
  }

  if (currentTab === "chats" && sidebarView === "starred") {
    return (
      <aside className="sidebar flex h-full min-h-0 w-full flex-col border-r bg-background text-foreground shrink-0 overflow-hidden min-w-0">
        <InPanelStarredMessages
          currentUserId={profile.id}
          onBack={() => setSidebarView("chats")}
        />
      </aside>
    );
  }

  return (
    <aside className="sidebar flex h-full min-h-0 w-full flex-col border-r bg-background text-foreground shrink-0 overflow-hidden min-w-0">
      {/* Top Header */}
      {isSelectionMode ? (
        <div className="flex h-16 items-center justify-between border-b px-4 sm:px-5 shrink-0 bg-muted/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
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
                  onClick={() => setSidebarView("new-direct")}
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
                      onSelect={() => setSidebarView("new-group")}
                      className="flex items-center gap-2.5 text-xs rounded-xl cursor-pointer p-2 hover:bg-muted font-medium"
                    >
                      <Users className="size-4 text-primary" />
                      <span>New Group</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={() => setSidebarView("starred")}
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
                      <CheckSquare className="size-4 text-primary" />
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
            <ScrollArea className="flex-1 w-full min-w-0 overflow-x-hidden">
              <div
                className="w-full min-w-0 space-y-1 pb-28 md:pb-6 pt-1 box-border overflow-hidden px-3"
              >
                {filteredConversations.map((conversation) => {
                  const title = getConversationTitle(conversation, profile.id);
                  const peers = getConversationPeers(conversation, profile.id);
                  const isOnline = conversation.type === "direct" && peers.some((peer) => onlineUserIds.has(peer.id));
                  const lastMessage = conversation.last_message;
                  const ownLastMessage = lastMessage?.sender_id === profile.id;
                  const readBySomeoneElse = lastMessage?.read_receipts?.some((r: { user_id: string }) => r.user_id !== profile.id);

                  const rawContent = lastMessage?.content || "";
                  const preview = lastMessage
                    ? lastMessage.message_type === "image"
                      ? "📷 Photo"
                      : rawContent.startsWith("![GIF]")
                        ? "🎬 GIF"
                        : rawContent.includes("**POLL:")
                          ? `📊 Poll: ${rawContent.match(/\*\*POLL:\s*([^*]+)\*\*/)?.[1]?.trim() || "Question"}`
                          : rawContent.match(/^(\S+)\s*\*\((.*?)\)\*$/)
                            ? `${rawContent.match(/^(\S+)\s*\*\((.*?)\)\*$/)?.[1]} Sticker`
                            : rawContent || "Attachment"
                    : "No messages yet";

                  const isSelected = conversation.id === selectedConversationId;
                  const isPinned = pinnedIds.has(conversation.id);
                  const isArchived = archivedIds.has(conversation.id);
                  const isMuted = mutedIds.has(conversation.id);
                  const isFavourite = favouriteIds.has(conversation.id);

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
                        style={{ width: "100%", boxSizing: "border-box", borderRadius: "14px" }}
                        className={cn(
                          "group relative flex items-center gap-3 w-full overflow-hidden box-border rounded-[14px] p-3 transition-all cursor-pointer select-none",
                          isSelectedInBatch
                            ? "bg-primary/15 border border-primary/30 shadow-xs"
                            : "hover:bg-muted/60 text-foreground"
                        )}
                      >
                        {/* Checkbox */}
                        <div
                          className={cn(
                            "grid size-5 place-items-center rounded-md border transition-colors shrink-0 flex-shrink-0",
                            isSelectedInBatch
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30 bg-background"
                          )}
                        >
                          {isSelectedInBatch && <Check className="size-3.5 stroke-[3]" />}
                        </div>

                        {/* 1. Avatar (Fixed size, never shrinks) */}
                        <div className="relative shrink-0 flex-shrink-0">
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

                        {/* 2. Middle Content Area (Takes remaining width, must have min-w-0 and overflow-hidden) */}
                        <div className="sidebar-item-content chat-info flex-1 min-w-0 flex flex-col justify-center gap-0.5 overflow-hidden">
                          {/* Top Row: Name + Badges + Timestamp */}
                          <div className="flex items-center justify-between gap-2 w-full min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="user-name text-[15px] sm:text-base font-semibold truncate block">
                                {title}
                              </span>
                              {isPinned && (
                                <Pin className="size-3 text-primary shrink-0 flex-shrink-0 rotate-45" />
                              )}
                            </div>
                            <span className="chat-time text-xs text-neutral-400 shrink-0 flex-shrink-0 font-medium">
                              {formatConversationTime(lastMessage?.created_at || conversation.updated_at)}
                            </span>
                          </div>

                          {/* Bottom Row: Checkmark / Icon + Truncated Preview Text */}
                          <div className="chat-preview flex items-center gap-1.5 w-full min-w-0">
                            <p className="sidebar-last-message sidebar-message-preview preview-text text-xs text-neutral-400 truncate block w-full min-w-0">
                              {preview}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={conversation.id}
                      role="button"
                      tabIndex={0}
                      style={{ width: "100%", boxSizing: "border-box", borderRadius: "14px" }}
                      className={cn(
                        "group relative flex items-center gap-3 p-3 w-full overflow-hidden box-border rounded-[14px] transition-all cursor-pointer select-none",
                        isSelected
                          ? "bg-muted shadow-xs"
                          : "hover:bg-muted/60 text-foreground"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        // Left-Click (Desktop & Mobile Tap): Opens the active chat window
                        setContextMenu(null);
                        router.push(`/chat/${conversation.id}`);
                      }}
                      onContextMenu={(e) => {
                        // Right-Click (contextmenu on Desktop): Prevents native context menu and opens custom options popup menu
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({
                          conversation,
                          position: { x: e.clientX, y: e.clientY },
                        });
                      }}
                      onTouchStart={(e) => {
                        if (e.touches.length !== 1) return;
                        const touch = e.touches[0];
                        touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
                        longPressFiredRef.current = false;
                        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                        longPressTimerRef.current = setTimeout(() => {
                          longPressFiredRef.current = true;
                          setContextMenu({
                            conversation,
                            position: { x: touchStartPosRef.current.x, y: touchStartPosRef.current.y },
                          });
                        }, 500);
                      }}
                      onTouchMove={(e) => {
                        if (!longPressTimerRef.current) return;
                        const touch = e.touches[0];
                        const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
                        const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
                        if (dx > 10 || dy > 10) {
                          clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = null;
                        }
                      }}
                      onTouchEnd={(e) => {
                        if (longPressTimerRef.current) {
                          clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = null;
                        }
                        if (longPressFiredRef.current) {
                          e.preventDefault();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          router.push(`/chat/${conversation.id}`);
                        } else if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
                          e.preventDefault();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setContextMenu({
                            conversation,
                            position: { x: rect.left + 50, y: rect.top + 30 },
                          });
                        }
                      }}
                    >
                      {/* 1. Avatar (Fixed size, never shrinks) */}
                      <div className="relative shrink-0 flex-shrink-0">
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

                      {/* 2. Middle Content Area (Takes remaining width, must have min-w-0 and overflow-hidden) */}
                      <div className="sidebar-item-content chat-info flex-1 min-w-0 flex flex-col justify-center gap-0.5 overflow-hidden">
                        {/* Top Row: Name + Badges + Timestamp */}
                        <div className="flex items-center justify-between gap-2 w-full min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="user-name text-[15px] sm:text-base font-semibold truncate block">
                              {title}
                            </span>
                            {isPinned && (
                              <Pin className="size-3 text-primary shrink-0 flex-shrink-0 rotate-45" />
                            )}
                            {isFavourite && (
                              <Heart className="size-3 fill-emerald-500 text-emerald-500 shrink-0 flex-shrink-0" />
                            )}
                            {isMuted && (
                              <BellOff className="size-3 text-muted-foreground shrink-0 flex-shrink-0" />
                            )}
                          </div>
                          <span className="chat-time text-xs text-neutral-400 shrink-0 flex-shrink-0 font-medium">
                            {formatConversationTime(lastMessage?.created_at || conversation.updated_at)}
                          </span>
                        </div>

                        {/* Bottom Row: Checkmark / Icon + Truncated Preview Text */}
                        <div className="chat-preview flex items-center gap-1.5 w-full min-w-0">
                          {ownLastMessage && (
                            <span className="text-xs text-neutral-400 shrink-0 flex-shrink-0 flex items-center">
                              {readBySomeoneElse ? (
                                <CheckCheck className="size-3.5 text-primary" aria-label="Read" />
                              ) : (
                                <Check className="size-3.5 text-neutral-400" aria-label="Sent" />
                              )}
                            </span>
                          )}

                          <p
                            className={cn(
                              "sidebar-last-message sidebar-message-preview preview-text text-xs text-neutral-400 truncate block w-full min-w-0 flex-1",
                              conversation.unread_count > 0 && "font-semibold text-foreground"
                            )}
                          >
                            {preview}
                          </p>

                          {conversation.unread_count > 0 && (
                            <span className="shrink-0 flex-shrink-0 ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hover Actions: Dropdown chevron for quick menu access */}
                      <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-background/90 backdrop-blur-md rounded-full border p-1 shadow-md z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu({
                              conversation,
                              position: { x: e.clientX, y: e.clientY },
                            });
                          }}
                          title="Chat options"
                          className="p-1 hover:text-primary transition-colors text-muted-foreground"
                        >
                          <ChevronDown className="size-3.5" />
                        </button>
                      </div>
                    </div>
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
                  <Archive className="size-3.5 text-primary" />
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
                  <Mail className="size-3.5 text-primary" />
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

        {/* 5. VAULT TAB */}
        {(currentTab === "vault" || (currentTab as string) === "media") && (
          <VaultView
            conversations={conversations}
            profile={profile}
          />
        )}

        {/* 6. SETTINGS TAB */}
        {currentTab === "settings" && (
          <SettingsView
            profile={profile}
            activeSection={settingsSection}
            onSectionChange={setSettingsSection}
          />
        )}
      </div>

      {/* MOBILE ONLY: Compact Bottom Navigation Bar (Root tabs only) */}
      {((currentTab === "chats" && !selectedConversationId && sidebarView === "chats") ||
        currentTab === "calls" ||
        currentTab === "status" ||
        (currentTab === "settings" && !settingsSection)) && (
        <div className="md:hidden">
          <MobileBottomNav
            activeTab={currentTab}
            onTabChange={handleTabChange}
            unreadChatsCount={totalUnreadCount}
          />
        </div>
      )}

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

      {contextMenu && (
        <ConversationContextMenu
          conversation={contextMenu.conversation}
          position={contextMenu.position}
          isOpen={Boolean(contextMenu)}
          isPinned={pinnedIds.has(contextMenu.conversation.id)}
          isArchived={archivedIds.has(contextMenu.conversation.id)}
          isMuted={mutedIds.has(contextMenu.conversation.id)}
          isFavourite={favouriteIds.has(contextMenu.conversation.id)}
          onClose={() => setContextMenu(null)}
          onToggleArchive={(id) => toggleArchive(id)}
          onToggleMute={(id) => toggleMute(id)}
          onTogglePin={(id) => togglePin(id)}
          onToggleUnread={(id) => toggleUnread(id)}
          onToggleFavourite={(id) => toggleFavourite(id)}
          onAddToList={(id) => handleAddToList(id)}
          onClearChat={(id) => handleClearChat(id)}
          onExitGroup={(id) => handleExitGroup(id)}
          onBlockContact={(id) => handleBlockContact(id)}
          onDeleteChat={(id) => handleDeleteChat(id)}
        />
      )}
    </aside>
  );
}
