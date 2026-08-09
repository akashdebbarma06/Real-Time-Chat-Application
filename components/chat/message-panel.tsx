"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { notifyIncomingMessage, requestNotificationPermission } from "@/lib/notifications";
import { InChatSearch } from "@/components/chat/in-chat-search";
import { MessageHeader } from "@/components/chat/message-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageComposer } from "@/components/chat/message-composer";
import { UserProfileSheet } from "@/components/chat/user-profile-sheet";
import { ComingSoonDialog } from "@/components/ui/coming-soon-dialog";
import { createClient } from "@/lib/supabase/client";
import { getConversationPeers, getConversationTitle, sanitizeFilename } from "@/lib/utils";
import type { ChatMessage, ConversationSummary, Profile } from "@/types/chat";

interface MessagePanelProps {
  profile: Profile;
  conversation?: ConversationSummary;
  conversationId: string;
  onlineUserIds: Set<string>;
  onConversationActivity: () => void;
}

interface TypingPayload {
  user_id: string;
  display_name: string;
  is_typing: boolean;
}

const MESSAGE_SELECT =
  "id, conversation_id, sender_id, content, message_type, attachment_path, attachment_name, attachment_size, created_at, edited_at, deleted_at, sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url, bio, last_seen_at), read_receipts:message_reads!message_reads_message_id_fkey(user_id, read_at)";

export function MessagePanel({
  profile,
  conversation,
  conversationId,
  onlineUserIds,
  onConversationActivity,
}: MessagePanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  const [userProfileSheetOpen, setUserProfileSheetOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState("Feature");

  const [isSearching, setIsSearching] = useState(false);
  const [inChatQuery, setInChatQuery] = useState("");
  const [isMuted, setIsMuted] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMarkedRef = useRef<string | null>(null);

  const loadMessages = useCallback(async () => {
    const { data, error } = await createClient()
      .from("messages")
      .select(MESSAGE_SELECT)
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) toast.error(error.message);
    else setMessages(((data || []) as unknown as ChatMessage[]).reverse());
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true);
      void loadMessages();
    });
    const supabase = createClient();
    const channel = supabase.channel(`conversation:${conversationId}`, {
      config: { private: true, broadcast: { self: false, ack: true } },
    });
    channelRef.current = channel;

    async function connect() {
      void requestNotificationPermission();
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) await supabase.realtime.setAuth(data.session.access_token);

      channel
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          const typing = payload as TypingPayload;
          if (typing.user_id === profile.id) return;
          setTypingUsers((current) => {
            const next = new Map(current);
            if (typing.is_typing) next.set(typing.user_id, typing.display_name);
            else next.delete(typing.user_id);
            return next;
          });
        })
        .on("broadcast", { event: "INSERT" }, (payload) => {
          void loadMessages();
          onConversationActivity();

          const newMsg = payload?.payload as { sender_id?: string; content?: string; sender_name?: string } | undefined;
          if (newMsg?.sender_id !== profile.id) {
            notifyIncomingMessage({
              senderName: newMsg?.sender_name || "Contact",
              content: newMsg?.content || "Sent a message",
              muted: isMuted,
            });
          }
        })
        .on("broadcast", { event: "UPDATE" }, () => {
          void loadMessages();
          onConversationActivity();
        })
        .on("broadcast", { event: "DELETE" }, () => {
          void loadMessages();
          onConversationActivity();
        })
        .on("broadcast", { event: "READ_RECEIPT" }, () => void loadMessages())
        .subscribe((status, error) => {
          if (status === "CHANNEL_ERROR") toast.error(error?.message || "Realtime connection failed");
        });
    }

    void connect();

    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [conversationId, isMuted, loadMessages, onConversationActivity, profile.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth" });
    const latest = [...messages].reverse().find((message) => message.sender_id !== profile.id);
    if (!latest || latest.id === lastMarkedRef.current || document.visibilityState !== "visible") return;
    lastMarkedRef.current = latest.id;
    void createClient()
      .rpc("mark_conversation_read", { p_conversation_id: conversationId, p_message_id: latest.id })
      .then(() => onConversationActivity());
  }, [conversationId, loading, messages, onConversationActivity, profile.id]);

  const title = conversation ? getConversationTitle(conversation, profile.id) : "Conversation";
  const peers = conversation ? getConversationPeers(conversation, profile.id) : [];
  const onlinePeers = peers.filter((peer) => onlineUserIds.has(peer.id));
  const isPeerOnline = conversation?.type === "direct" && onlinePeers.length > 0;

  const statusText =
    conversation?.type === "group"
      ? `${conversation.members.length} members${onlinePeers.length ? ` · ${onlinePeers.length} online` : ""}`
      : isPeerOnline
        ? "Online"
        : peers[0]
          ? `Last seen ${new Date(peers[0].last_seen_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : "Offline";

  const lastOwnMessageId = [...messages].reverse().find((message) => message.sender_id === profile.id)?.id;

  const typingLabel = useMemo(() => {
    const names = [...typingUsers.values()];
    if (!names.length) return "";
    if (names.length === 1) return `${names[0]} is typing…`;
    return `${names.slice(0, 2).join(" and ")} are typing…`;
  }, [typingUsers]);

  const displayMessages = useMemo(() => {
    if (!inChatQuery.trim()) return messages;
    const q = inChatQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content?.toLowerCase().includes(q) ||
        m.attachment_name?.toLowerCase().includes(q) ||
        m.sender.display_name.toLowerCase().includes(q)
    );
  }, [inChatQuery, messages]);

  function broadcastTyping(isTyping: boolean) {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    void channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: profile.id, display_name: profile.display_name, is_typing: isTyping } satisfies TypingPayload,
    });
    if (isTyping) {
      typingTimer.current = setTimeout(() => {
        void channelRef.current?.send({
          type: "broadcast",
          event: "typing",
          payload: { user_id: profile.id, display_name: profile.display_name, is_typing: false } satisfies TypingPayload,
        });
      }, 1400);
    }
  }

  async function sendText(content: string) {
    setSending(true);
    let finalContent = content;
    if (replyingToMessage) {
      finalContent = `> Replying to ${replyingToMessage.sender.display_name}: ${replyingToMessage.content || "Attachment"}\n${content}`;
      setReplyingToMessage(null);
    }

    const { error } = await createClient()
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: profile.id, content: finalContent, message_type: "text" });

    setSending(false);
    if (error) toast.error(error.message);
    else void loadMessages();
  }

  async function sendFile(file: File, caption: string) {
    setSending(true);
    const supabase = createClient();
    const path = `${conversationId}/${profile.id}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("chat-files")
      .upload(path, file, { cacheControl: "3600", contentType: file.type || "application/octet-stream", upsert: false });

    if (uploadError) {
      setSending(false);
      toast.error(uploadError.message);
      return;
    }

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: profile.id,
      content: caption,
      message_type: file.type.startsWith("image/") ? "image" : "file",
      attachment_path: path,
      attachment_name: file.name,
      attachment_size: file.size,
    });

    setSending(false);
    if (error) toast.error(error.message);
    else void loadMessages();
  }

  async function handleEditMessage(messageId: string, newContent: string) {
    const { error } = await createClient()
      .from("messages")
      .update({ content: newContent, edited_at: new Date().toISOString() })
      .eq("id", messageId);

    if (error) toast.error(error.message);
    else void loadMessages();
  }

  async function handleDeleteMessage(messageId: string) {
    const { error } = await createClient()
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", messageId);

    if (error) toast.error(error.message);
    else {
      toast.success("Message deleted");
      void loadMessages();
    }
  }

  function exportChatHistory() {
    if (!messages.length) return toast.error("No messages to export");
    const transcript = messages
      .map(
        (m) =>
          `[${new Date(m.created_at).toLocaleString()}] ${m.sender.display_name}: ${m.content || m.attachment_name || ""}`
      )
      .join("\n");

    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aether-chat-${title.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat history exported!");
  }

  return (
    <section className="flex h-svh min-h-0 flex-col bg-background">
      <MessageHeader
        title={title}
        conversation={conversation}
        profile={profile}
        peers={peers}
        isPeerOnline={isPeerOnline}
        statusText={statusText}
        typingLabel={typingLabel}
        isMuted={isMuted}
        isSearching={isSearching}
        onToggleSearch={() => {
          setIsSearching(!isSearching);
          if (isSearching) setInChatQuery("");
        }}
        onToggleMute={() => setIsMuted(!isMuted)}
        onExportHistory={exportChatHistory}
        onClearHistory={() => {
          setMessages([]);
          toast.success("Chat history cleared");
        }}
        onOpenProfile={() => setUserProfileSheetOpen(true)}
        onOpenFeature={(feature) => {
          setComingSoonFeature(feature);
          setComingSoonOpen(true);
        }}
      />

      {isSearching && (
        <InChatSearch
          query={inChatQuery}
          matchCount={displayMessages.length}
          onQueryChange={setInChatQuery}
          onClose={() => {
            setIsSearching(false);
            setInChatQuery("");
          }}
        />
      )}

      <MessageList
        messages={displayMessages}
        loading={loading}
        currentUserId={profile.id}
        isGroup={conversation?.type === "group"}
        lastOwnMessageId={lastOwnMessageId}
        typingLabel={typingLabel}
        inChatQuery={inChatQuery}
        title={title}
        bottomRef={bottomRef}
        onReply={(msg) => setReplyingToMessage(msg)}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
      />

      <MessageComposer
        sending={sending}
        disabled={!conversation}
        replyToMessage={replyingToMessage}
        onCancelReply={() => setReplyingToMessage(null)}
        onSendText={sendText}
        onSendFile={sendFile}
        onTyping={broadcastTyping}
      />

      <UserProfileSheet
        open={userProfileSheetOpen}
        onOpenChange={setUserProfileSheetOpen}
        peerProfile={peers[0] || null}
        isOnline={isPeerOnline}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
      />

      <ComingSoonDialog
        open={comingSoonOpen}
        onOpenChange={setComingSoonOpen}
        featureName={comingSoonFeature}
      />
    </section>
  );
}
