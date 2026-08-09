"use client";

import type { RefObject } from "react";
import { MessageCircleMore } from "lucide-react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  currentUserId: string;
  isGroup: boolean;
  lastOwnMessageId?: string;
  typingLabel: string;
  inChatQuery: string;
  title: string;
  bottomRef: RefObject<HTMLDivElement | null>;
  onReply: (message: ChatMessage) => void;
  onEdit: (messageId: string, newContent: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}

function formatMessageDateSeparator(dateString: string): string {
  const d = new Date(dateString);
  const now = new Date();

  if (d.toDateString() === now.toDateString()) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
  if (diffDays < 7) {
    return d.toLocaleDateString("en-US", { weekday: "long" });
  }

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function MessageList({
  messages,
  loading,
  currentUserId,
  isGroup,
  lastOwnMessageId,
  typingLabel,
  inChatQuery,
  title,
  bottomRef,
  onReply,
  onEdit,
  onDelete,
}: MessageListProps) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div
        className={cn(
          "mx-auto max-w-6xl px-3 sm:px-5",
          messages.length > 0 ? "flex flex-col py-4" : "flex min-h-full flex-col items-center justify-center py-5"
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
        ) : messages.length ? (
          <div className="space-y-5 sm:space-y-6">
            {messages.map((message, index) => {
              const currentDateLabel = formatMessageDateSeparator(message.created_at);
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const prevDateLabel = prevMessage ? formatMessageDateSeparator(prevMessage.created_at) : null;
              const showDateSeparator = currentDateLabel !== prevDateLabel;

              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="my-6 flex items-center justify-center gap-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
                      <span className="rounded-full border border-slate-800/80 bg-slate-900/90 px-3.5 py-1 text-[11px] font-semibold text-slate-400 shadow-sm backdrop-blur-md">
                        {currentDateLabel}
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
                    </div>
                  )}

                  <MessageBubble
                    message={message}
                    currentUserId={currentUserId}
                    showSenderName={isGroup}
                    showReceipt={message.id === lastOwnMessageId}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              );
            })}

            {typingLabel && (
              <div className="flex items-end gap-2.5 my-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3 rounded-3xl rounded-bl-[6px] border border-slate-800/80 bg-slate-900/90 px-4.5 py-3 shadow-lg shadow-black/20 backdrop-blur-md">
                  <span className="text-xs font-medium text-slate-300">{typingLabel}</span>
                  <div className="flex items-center gap-1.5 px-0.5">
                    <span className="size-2 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="size-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="size-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto grid size-20 place-items-center rounded-3xl border border-slate-800 bg-slate-900/90 text-cyan-400 shadow-xl shadow-cyan-500/10 backdrop-blur-md">
              <MessageCircleMore className="size-9" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-100">
              {inChatQuery ? "No matching messages" : "Start the conversation"}
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
              {inChatQuery
                ? `No messages match "${inChatQuery}". Try searching for another keyword.`
                : `Say hello or share a file to kick off your chat with ${title}! 👋`}
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
