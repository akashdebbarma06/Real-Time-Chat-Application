"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { EmptyChat } from "@/components/chat/empty-chat";
import { KeyboardShortcutsDialog } from "@/components/chat/keyboard-shortcuts-dialog";
import { MessagePanel } from "@/components/chat/message-panel";
import { NavigationRail, type RailTab } from "@/components/chat/navigation-rail";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { usePresence } from "@/hooks/use-presence";
import { useBackHandler } from "@/hooks/use-back-handler";
import { createClient } from "@/lib/supabase/client";
import { getConversationTitle } from "@/lib/utils";
import { InPanelUserProfile } from "@/components/chat/in-panel-user-profile";
import { InPanelGroupInfo } from "@/components/chat/in-panel-group-info";
import { PermissionModal } from "@/components/permissions/permission-modal";
import { hasPromptedInitialPermissions } from "@/lib/permissions/device-permissions";
import type { ConversationSummary, Profile } from "@/types/chat";

interface ChatWorkspaceProps {
  profile: Profile;
  selectedConversationId?: string;
}

export function ChatWorkspace({ profile, selectedConversationId }: ChatWorkspaceProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [railTab, setRailTab] = useState<RailTab>("chats");
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [sideDetailView, setSideDetailView] = useState<
    | { type: "user-profile"; profile: Profile; isOnline?: boolean; returnToGroup?: boolean }
    | { type: "group-info"; conversation: ConversationSummary }
    | null
  >(null);
  const onlineUserIds = usePresence(profile.id);

  // Responsive mobile tracking for active chat dismissal
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId);

  // Priority 2: In-Panel Contact / Group Info Drawer
  useBackHandler({
    id: "chat-side-detail-view",
    priority: 50,
    enabled: Boolean(sideDetailView),
    onBack: () => {
      if (sideDetailView?.type === "user-profile" && sideDetailView.returnToGroup && selectedConversation) {
        setSideDetailView({
          type: "group-info",
          conversation: selectedConversation,
        });
      } else {
        setSideDetailView(null);
      }
    },
  });

  // Priority 3: Active Mobile Conversation
  useBackHandler({
    id: "chat-active-conversation-mobile",
    priority: 25,
    enabled: Boolean(selectedConversationId) && isMobile,
    onBack: () => {
      router.push("/chat");
    },
  });

  // Auto-prompt initial permissions modal once on first visit
  useEffect(() => {
    if (!hasPromptedInitialPermissions()) {
      const timer = setTimeout(() => {
        setPermissionModalOpen(true);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTabChange = useCallback((tab: RailTab) => {
    setRailTab(tab);
    setSideDetailView(null);
  }, []);

  const loadConversations = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    const { data, error } = await createClient().rpc("get_conversation_summaries", {});
    if (error) toast.error(error.message);
    else {
      const parsed = ((data || []) as unknown as ConversationSummary[]).map((item) => ({
        ...item,
        members: Array.isArray(item.members) ? item.members : [],
        last_message: item.last_message && typeof item.last_message === "object" ? item.last_message : null,
        unread_count: Number(item.unread_count || 0),
      })) as ConversationSummary[];
      setConversations(parsed);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadConversations(true);
    });
    const supabase = createClient();
    const channel = supabase
      .channel(`user-conversations:${profile.id}`, { config: { private: true } })
      .on("broadcast", { event: "conversation_changed" }, () => void loadConversations())
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => void loadConversations()
      );

    void supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.access_token) await supabase.realtime.setAuth(data.session.access_token);
      channel.subscribe();
    });

    return () => { void supabase.removeChannel(channel); };
  }, [loadConversations, profile.id]);

  // Desktop Keyboard Shortcuts Handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      // Ctrl + K -> Search
      if (isCmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement | null;
        if (searchInput) searchInput.focus();
        else toast.info("Search focused");
      }

      // Ctrl + N -> New Chat
      if (isCmdOrCtrl && e.key.toLowerCase() === "n" && !e.shiftKey) {
        e.preventDefault();
        setNewChatOpen(true);
      }

      // Ctrl + Shift + M -> Toggle Mute
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        toast.success("Mute toggled for current conversation");
      }

      // Esc -> Clear Search / Close
      if (e.key === "Escape") {
        setQuery("");
        setNewChatOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleConversationActivity = useCallback(() => {
    void loadConversations();
  }, [loadConversations]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return conversations;
    return conversations.filter((conversation) => {
      const title = getConversationTitle(conversation, profile.id).toLowerCase();
      return title.includes(normalized) || conversation.members.some((member) => member.profile.username.toLowerCase().includes(normalized));
    });
  }, [conversations, profile.id, query]);

  const totalUnread = useMemo(
    () => conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0),
    [conversations]
  );

  if (loading) {
    return (
      <div className="flex h-svh w-full bg-background">
        <div className="hidden md:flex w-20 shrink-0 border-r p-3 flex-col items-center gap-3">
          <Skeleton className="size-11 rounded-2xl" />
          <Skeleton className="size-12 rounded-xl mt-4" />
          <Skeleton className="size-12 rounded-xl" />
          <Skeleton className="size-12 rounded-xl" />
        </div>
        <div className="w-full md:w-[460px] md:min-w-[460px] shrink-0 border-r p-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="hidden flex-1 items-center justify-center md:flex min-w-0">
          <Skeleton className="h-48 w-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-svh min-h-0 overflow-hidden bg-background text-foreground">
      {/* 1. Desktop Fixed Left Navigation Rail: 80px */}
      <NavigationRail
        profile={profile}
        activeTab={railTab}
        onTabChange={handleTabChange}
        unreadChatsCount={totalUnread}
      />

      {/* 2. Side Panel (Conversation Sidebar / In-Panel Detail): 460px */}
      <div
        className={
          sideDetailView
            ? "sidebar block w-full md:w-[460px] md:min-w-[460px] shrink-0 h-full min-h-0 z-20 overflow-hidden min-w-0"
            : selectedConversationId
              ? "sidebar hidden md:block w-full md:w-[460px] md:min-w-[460px] shrink-0 h-full min-h-0 overflow-hidden min-w-0"
              : "sidebar block w-full md:w-[460px] md:min-w-[460px] shrink-0 h-full min-h-0 overflow-hidden min-w-0"
        }
      >
        {sideDetailView?.type === "user-profile" ? (
          <InPanelUserProfile
            peerProfile={sideDetailView.profile}
            currentUserId={profile.id}
            conversationId={selectedConversationId}
            isOnline={sideDetailView.isOnline ?? onlineUserIds.has(sideDetailView.profile.id)}
            onBack={() => {
              if (sideDetailView.returnToGroup && selectedConversation) {
                setSideDetailView({
                  type: "group-info",
                  conversation: selectedConversation,
                });
              } else {
                setSideDetailView(null);
              }
            }}
          />
        ) : sideDetailView?.type === "group-info" ? (
          <InPanelGroupInfo
            conversation={sideDetailView.conversation}
            currentUserId={profile.id}
            onlineUserIds={onlineUserIds}
            onSelectMember={(p) => {
              setSideDetailView({
                type: "user-profile",
                profile: p,
                isOnline: onlineUserIds.has(p.id),
                returnToGroup: true,
              });
            }}
            onConversationActivity={handleConversationActivity}
            onBack={() => setSideDetailView(null)}
          />
        ) : (
          <ConversationSidebar
            profile={profile}
            conversations={filtered}
            selectedConversationId={selectedConversationId}
            onlineUserIds={onlineUserIds}
            query={query}
            onQueryChange={setQuery}
            onConversationCreated={() => void loadConversations()}
            activeTab={railTab}
            onTabChange={handleTabChange}
          />
        )}
      </div>

      {/* 3. Chat Content: remaining width flex-1 */}
      <div className={sideDetailView ? "hidden md:block flex-1 min-w-0 h-full min-h-0 relative overflow-hidden" : "flex-1 min-w-0 h-full min-h-0 relative overflow-hidden"}>
        {selectedConversationId ? (
          <MessagePanel
            key={selectedConversationId}
            profile={profile}
            conversation={selectedConversation}
            conversationId={selectedConversationId}
            onlineUserIds={onlineUserIds}
            onConversationActivity={handleConversationActivity}
            onOpenUserProfile={(peer) => {
              setSideDetailView({
                type: "user-profile",
                profile: peer,
                isOnline: onlineUserIds.has(peer.id),
              });
            }}
            onOpenGroupInfo={() => {
              if (selectedConversation) {
                setSideDetailView({
                  type: "group-info",
                  conversation: selectedConversation,
                });
              }
            }}
          />
        ) : (
          <EmptyChat currentUserId={profile.id} onCreated={() => void loadConversations()} />
        )}
      </div>

      {/* Global Desktop Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsDialog />

      {/* Controlled New Chat Dialog for Ctrl+N */}
      <NewChatDialog
        currentUserId={profile.id}
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        onCreated={() => {
          setNewChatOpen(false);
          void loadConversations();
        }}
        triggerVariant="none"
      />

      {/* Comprehensive Device & Web Permissions Setup Modal */}
      <PermissionModal
        open={permissionModalOpen}
        onOpenChange={setPermissionModalOpen}
      />
    </main>
  );
}
