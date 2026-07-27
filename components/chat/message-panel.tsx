"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageCircleMore, MoreHorizontal, UsersRound } from "lucide-react";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { ConversationAvatar } from "@/components/chat/conversation-avatar";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageComposer } from "@/components/chat/message-composer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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

const MESSAGE_SELECT = "id, conversation_id, sender_id, content, message_type, attachment_path, attachment_name, attachment_size, created_at, edited_at, deleted_at, sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url, bio, last_seen_at), read_receipts:message_reads!message_reads_message_id_fkey(user_id, read_at)";

export function MessagePanel({ profile, conversation, conversationId, onlineUserIds, onConversationActivity }: MessagePanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMarkedRef = useRef<string | null>(null);

  const loadMessages = useCallback(async () => {
    const { data, error } = await createClient().from("messages").select(MESSAGE_SELECT).eq("conversation_id", conversationId).is("deleted_at", null).order("created_at", { ascending: false }).limit(100);
    if (error) toast.error(error.message);
    else setMessages(((data || []) as unknown as ChatMessage[]).reverse());
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    setLoading(true);
    void loadMessages();
    const supabase = createClient();
    const channel = supabase.channel(`conversation:${conversationId}`, {
      config: { private: true, broadcast: { self: false, ack: true } },
    });
    channelRef.current = channel;

    async function connect() {
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
        .on("broadcast", { event: "INSERT" }, () => { void loadMessages(); onConversationActivity(); })
        .on("broadcast", { event: "UPDATE" }, () => { void loadMessages(); onConversationActivity(); })
        .on("broadcast", { event: "DELETE" }, () => { void loadMessages(); onConversationActivity(); })
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
  }, [conversationId, loadMessages, onConversationActivity, profile.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth" });
    const latest = [...messages].reverse().find((message) => message.sender_id !== profile.id);
    if (!latest || latest.id === lastMarkedRef.current || document.visibilityState !== "visible") return;
    lastMarkedRef.current = latest.id;
    void createClient().rpc("mark_conversation_read", { p_conversation_id: conversationId, p_message_id: latest.id }).then(() => onConversationActivity());
  }, [conversationId, loading, messages, onConversationActivity, profile.id]);

  const title = conversation ? getConversationTitle(conversation, profile.id) : "Conversation";
  const peers = conversation ? getConversationPeers(conversation, profile.id) : [];
  const onlinePeers = peers.filter((peer) => onlineUserIds.has(peer.id));
  const status = conversation?.type === "group"
    ? `${conversation.members.length} members${onlinePeers.length ? ` · ${onlinePeers.length} online` : ""}`
    : onlinePeers.length ? "Online" : peers[0] ? `Last seen ${new Date(peers[0].last_seen_at).toLocaleString()}` : "Offline";
  const lastOwnMessageId = [...messages].reverse().find((message) => message.sender_id === profile.id)?.id;

  const typingLabel = useMemo(() => {
    const names = [...typingUsers.values()];
    if (!names.length) return "";
    if (names.length === 1) return `${names[0]} is typing…`;
    return `${names.slice(0, 2).join(" and ")} are typing…`;
  }, [typingUsers]);

  function broadcastTyping(isTyping: boolean) {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    void channelRef.current?.send({ type: "broadcast", event: "typing", payload: { user_id: profile.id, display_name: profile.display_name, is_typing: isTyping } satisfies TypingPayload });
    if (isTyping) {
      typingTimer.current = setTimeout(() => {
        void channelRef.current?.send({ type: "broadcast", event: "typing", payload: { user_id: profile.id, display_name: profile.display_name, is_typing: false } satisfies TypingPayload });
      }, 1400);
    }
  }

  async function sendText(content: string) {
    setSending(true);
    const { error } = await createClient().from("messages").insert({ conversation_id: conversationId, sender_id: profile.id, content, message_type: "text" });
    setSending(false);
    if (error) toast.error(error.message);
  }

  async function sendFile(file: File, caption: string) {
    setSending(true);
    const supabase = createClient();
    const path = `${conversationId}/${profile.id}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, file, { cacheControl: "3600", contentType: file.type || "application/octet-stream", upsert: false });
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
  }

  return (
    <section className="flex h-svh min-h-0 flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background/90 px-3 backdrop-blur-xl sm:px-5">
        <Button asChild variant="ghost" size="icon-sm" className="md:hidden"><Link href="/chat" aria-label="Back to conversations"><ArrowLeft /></Link></Button>
        {conversation ? <ConversationAvatar conversation={conversation} userId={profile.id} className="size-9" /> : <div className="grid size-9 place-items-center rounded-full bg-muted"><MessageCircleMore className="size-4" /></div>}
        <div className="min-w-0 flex-1"><h1 className="truncate text-sm font-semibold sm:text-base">{title}</h1><p className="truncate text-xs text-muted-foreground">{typingLabel || status}</p></div>
        {conversation?.type === "group" && <Button variant="ghost" size="icon-sm" aria-label="Group members"><UsersRound /></Button>}
        <Button variant="ghost" size="icon-sm" aria-label="Conversation options"><MoreHorizontal /></Button>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-end px-3 py-5 sm:px-6">
          {loading ? (
            <div className="space-y-5">{Array.from({ length: 7 }).map((_, index) => <div key={index} className={index % 3 === 0 ? "flex justify-end" : "flex justify-start"}><Skeleton className="h-14 w-[55%] rounded-2xl" /></div>)}</div>
          ) : messages.length ? (
            <div className="space-y-3">
              {messages.map((message) => <MessageBubble key={message.id} message={message} currentUserId={profile.id} showSenderName={conversation?.type === "group"} showReceipt={message.id === lastOwnMessageId} />)}
              {typingLabel && <div className="flex items-center gap-2 px-10 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" />{typingLabel}</div>}
            </div>
          ) : (
            <div className="py-20 text-center"><div className="mx-auto grid size-16 place-items-center rounded-2xl border bg-card"><MessageCircleMore className="size-7 text-primary" /></div><h2 className="mt-5 text-lg font-semibold">Start the conversation</h2><p className="mt-2 text-sm text-muted-foreground">Send a message or share a file with {title}.</p></div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <MessageComposer sending={sending} disabled={!conversation} onSendText={sendText} onSendFile={sendFile} onTyping={broadcastTyping} />
    </section>
  );
}
