"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Download,
  MessageCircleMore,
  MoreVertical,
  Search,
  Trash2,
  User,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { notifyIncomingMessage, requestNotificationPermission } from "@/lib/notifications";
import { ConversationAvatar } from "@/components/chat/conversation-avatar";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageComposer } from "@/components/chat/message-composer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn, getConversationPeers, getConversationTitle, sanitizeFilename } from "@/lib/utils";
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

  // In-Chat Search State
  const [isSearching, setIsSearching] = useState(false);
  const [inChatQuery, setInChatQuery] = useState("");

  // Notification Mute State
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

          // Notification sound & push alert
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
  }, [conversationId, loadMessages, onConversationActivity, profile.id]);

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

  const statusText = conversation?.type === "group"
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

  // In-Chat Search Filtered Messages
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
    a.download = `chatsphere-${title.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat history exported!");
  }

  return (
    <section className="flex h-svh min-h-0 flex-col bg-background">
      {/* Improved Chat Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/90 px-3 backdrop-blur-xl sm:px-5">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button asChild variant="ghost" size="icon-sm" className="md:hidden">
            <Link href="/chat" aria-label="Back to conversations">
              <ArrowLeft />
            </Link>
          </Button>

          <div className="relative shrink-0">
            {conversation ? (
              <ConversationAvatar conversation={conversation} userId={profile.id} className="size-10" />
            ) : (
              <div className="grid size-10 place-items-center rounded-full bg-muted">
                <MessageCircleMore className="size-5" />
              </div>
            )}
            {/* Online/Offline Visual Status Indicator Dot */}
            {conversation?.type === "direct" && (
              <span
                className={cn(
                  "absolute bottom-0 right-0 size-3 rounded-full border-2 border-background shadow-sm",
                  isPeerOnline ? "bg-emerald-500" : "bg-slate-400"
                )}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold">{title}</h1>
              {isMuted && <BellOff className="size-3.5 text-muted-foreground shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn(
                  "size-2 rounded-full shrink-0",
                  isPeerOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                )}
              />
              <span className="truncate">{typingLabel || statusText}</span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Toggle In-Chat Search Button */}
          <Button
            variant={isSearching ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => {
              setIsSearching(!isSearching);
              if (isSearching) setInChatQuery("");
            }}
            aria-label="Search within chat"
            className="rounded-full"
          >
            <Search className="size-4" />
          </Button>

          {conversation?.type === "group" && (
            <Button variant="ghost" size="icon-sm" aria-label="Group members" className="rounded-full">
              <UsersRound className="size-4" />
            </Button>
          )}

          {/* 3-Dots Overflow Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Conversation options" className="rounded-full">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-56 bg-slate-900 border-slate-800 text-slate-100 p-1 rounded-2xl shadow-xl">
              <DropdownMenuItem
                onClick={() => toast.info(`Viewing info for ${title}`)}
                className="flex items-center gap-2 text-xs rounded-xl cursor-pointer"
              >
                <User className="size-4 text-cyan-400" />
                <span>Contact Info</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setIsSearching(true)}
                className="flex items-center gap-2 text-xs rounded-xl cursor-pointer"
              >
                <Search className="size-4 text-cyan-400" />
                <span>Search in Chat</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  setIsMuted(!isMuted);
                  toast.success(isMuted ? "Notifications unmuted" : "Notifications muted");
                }}
                className="flex items-center gap-2 text-xs rounded-xl cursor-pointer"
              >
                {isMuted ? <Bell className="size-4 text-emerald-400" /> : <BellOff className="size-4 text-amber-400" />}
                <span>{isMuted ? "Unmute Notifications" : "Mute Notifications"}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={exportChatHistory}
                className="flex items-center gap-2 text-xs rounded-xl cursor-pointer"
              >
                <Download className="size-4 text-cyan-400" />
                <span>Export Chat Transcript</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800 my-1" />

              <DropdownMenuItem
                onClick={() => {
                  setMessages([]);
                  toast.success("Chat history cleared");
                }}
                className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 rounded-xl cursor-pointer"
              >
                <Trash2 className="size-4" />
                <span>Clear Chat History</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Expandable In-Chat Search Bar */}
      {isSearching && (
        <div className="flex items-center gap-2 border-b bg-slate-900/90 px-4 py-2 text-xs">
          <Search className="size-4 text-cyan-400 shrink-0" />
          <Input
            value={inChatQuery}
            onChange={(e) => setInChatQuery(e.target.value)}
            placeholder="Search messages in this chat..."
            className="h-8 border-slate-800 bg-slate-950 text-slate-100 text-xs rounded-xl focus-visible:ring-cyan-500/50"
            autoFocus
          />
          {inChatQuery && (
            <span className="text-[11px] text-slate-400 shrink-0">
              {displayMessages.length} match{displayMessages.length !== 1 ? "es" : ""}
            </span>
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => {
              setIsSearching(false);
              setInChatQuery("");
            }}
            className="size-7 rounded-full text-slate-400 hover:text-white"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <ScrollArea className="min-h-0 flex-1">
        <div
          className={cn(
            "mx-auto max-w-6xl px-3 sm:px-5",
            displayMessages.length > 0 ? "flex flex-col py-4" : "flex min-h-full flex-col items-center justify-center py-5"
          )}
        >
          {loading ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className={index % 3 === 0 ? "flex justify-end" : "flex justify-start"}>
                  <Skeleton className="h-14 w-[55%] rounded-2xl" />
                </div>
              ))}
            </div>
          ) : displayMessages.length ? (
            <div className="space-y-5 sm:space-y-6">
              {displayMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUserId={profile.id}
                  showSenderName={conversation?.type === "group"}
                  showReceipt={message.id === lastOwnMessageId}
                  onReply={(msg) => setReplyingToMessage(msg)}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                />
              ))}

              {/* Animated 3-dot Typing Indicator */}
              {typingLabel && (
                <div className="flex items-center gap-2 px-4 py-2">
                  <div className="flex items-center gap-1 rounded-full bg-slate-900 border border-slate-800 px-3 py-2 shadow-sm">
                    <span className="size-2 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="size-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="size-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-xs text-muted-foreground">{typingLabel}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl border bg-card">
                <MessageCircleMore className="size-7 text-primary" />
              </div>
              <h2 className="mt-5 text-lg font-semibold">
                {inChatQuery ? "No matching messages" : "Start the conversation"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {inChatQuery
                  ? `No messages match "${inChatQuery}"`
                  : `Send a message or share a file with ${title}.`}
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <MessageComposer
        sending={sending}
        disabled={!conversation}
        replyToMessage={replyingToMessage}
        onCancelReply={() => setReplyingToMessage(null)}
        onSendText={sendText}
        onSendFile={sendFile}
        onTyping={broadcastTyping}
      />
    </section>
  );
}
