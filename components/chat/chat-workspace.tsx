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
import { BrandedLoadingScreen } from "@/components/ui/branded-loading-screen";
import { usePresence } from "@/hooks/use-presence";
import { useBackHandler } from "@/hooks/use-back-handler";
import { createClient } from "@/lib/supabase/client";
import { getConversationPeers, getConversationTitle } from "@/lib/utils";
import { InPanelUserProfile } from "@/components/chat/in-panel-user-profile";
import { InPanelGroupInfo } from "@/components/chat/in-panel-group-info";
import { PermissionModal } from "@/components/permissions/permission-modal";
import { hasPromptedInitialPermissions } from "@/lib/permissions/device-permissions";
import { notifyIncomingMessage } from "@/lib/notifications";
import { useUnreadTabIndicator } from "@/features/notifications/UnreadTabIndicator.shared";
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
    | { type: "user-profile"; profile: Profile; isOnline?: boolean; returnToGroup?: boolean; conversationId?: string }
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


  const handleTabChange = useCallback((tab: RailTab) => {
    setRailTab(tab);
    setSideDetailView(null);
  }, []);

  const handleOpenConversationInfo = useCallback(
    (conv: ConversationSummary) => {
      if (conv.type === "group") {
        setSideDetailView({
          type: "group-info",
          conversation: conv,
        });
      } else {
        const peers = getConversationPeers(conv, profile.id);
        const peer = peers[0];
        if (peer) {
          setSideDetailView({
            type: "user-profile",
            profile: peer,
            conversationId: conv.id,
            isOnline: onlineUserIds.has(peer.id),
          });
        }
      }
    },
    [profile.id, onlineUserIds]
  );

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
        (payload) => {
          void loadConversations();
          const newMsg = payload.new as { sender_id?: string; conversation_id?: string; content?: string } | undefined;
          if (newMsg && newMsg.sender_id !== profile.id && newMsg.conversation_id !== selectedConversationId) {
            notifyIncomingMessage({
              senderName: "New Message",
              content: newMsg.content || "Sent an attachment",
              conversationId: newMsg.conversation_id,
            });
          }
        }
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

  // Dynamic unread browser tab title and favicon badge (active on desktop web)
  useUnreadTabIndicator(totalUnread, () => {
    void loadConversations();
  });

  if (loading) {
    return <BrandedLoadingScreen fullScreen message="Loading conversations..." />;
  }

  return (
    <main className="flex h-full h-svh h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden bg-background text-foreground safe-area-pt">
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
            conversationId={sideDetailView.conversationId || selectedConversationId}
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
            onOpenConversationInfo={handleOpenConversationInfo}
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
