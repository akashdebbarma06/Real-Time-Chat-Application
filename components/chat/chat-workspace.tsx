"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { EmptyChat } from "@/components/chat/empty-chat";
import { MessagePanel } from "@/components/chat/message-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { usePresence } from "@/hooks/use-presence";
import { createClient } from "@/lib/supabase/client";
import { getConversationTitle } from "@/lib/utils";
import type { ConversationSummary, Profile } from "@/types/chat";

interface ChatWorkspaceProps {
  profile: Profile;
  selectedConversationId?: string;
}

export function ChatWorkspace({ profile, selectedConversationId }: ChatWorkspaceProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const onlineUserIds = usePresence(profile.id);

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
      .on("broadcast", { event: "conversation_changed" }, () => void loadConversations());

    void supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.access_token) await supabase.realtime.setAuth(data.session.access_token);
      channel.subscribe();
    });

    return () => { void supabase.removeChannel(channel); };
  }, [loadConversations, profile.id]);

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

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId);

  if (loading) {
    return <div className="grid h-svh md:grid-cols-[360px_1fr]"><div className="border-r p-4"><Skeleton className="h-12 w-full" /><div className="mt-6 space-y-3">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-16 w-full rounded-xl" />)}</div></div><div className="hidden items-center justify-center md:flex"><Skeleton className="h-48 w-80 rounded-3xl" /></div></div>;
  }

  return (
    <main className="grid h-svh min-h-0 overflow-hidden md:grid-cols-[360px_minmax(0,1fr)]">
      <div className={selectedConversationId ? "hidden md:block" : "block"}>
        <ConversationSidebar profile={profile} conversations={filtered} selectedConversationId={selectedConversationId} onlineUserIds={onlineUserIds} query={query} onQueryChange={setQuery} onConversationCreated={() => void loadConversations()} />
      </div>
      {selectedConversationId ? (
        <MessagePanel key={selectedConversationId} profile={profile} conversation={selectedConversation} conversationId={selectedConversationId} onlineUserIds={onlineUserIds} onConversationActivity={handleConversationActivity} />
      ) : <EmptyChat currentUserId={profile.id} />}
    </main>
  );
}
