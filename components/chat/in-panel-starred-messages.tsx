"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  fetchFullStarredMessages,
  toggleMessageStar,
  type StarredMessageItem,
} from "@/lib/starred-store";
import { formatConversationTime, getInitials } from "@/lib/utils";

interface InPanelStarredMessagesProps {
  currentUserId: string;
  onBack: () => void;
}

export function InPanelStarredMessages({
  currentUserId,
  onBack,
}: InPanelStarredMessagesProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<StarredMessageItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    setLoading(true);
    fetchFullStarredMessages(currentUserId)
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [currentUserId]);

  async function handleUnstar(item: StarredMessageItem, e: React.MouseEvent) {
    e.stopPropagation();
    await toggleMessageStar(currentUserId, item.message_id, item.conversation_id);
    setMessages((prev) => prev.filter((m) => m.message_id !== item.message_id));
    toast.success("Message unstarred");
  }

  function handleOpenChat(conversationId: string) {
    if (!conversationId) return;
    onBack();
    router.push(`/chat/${conversationId}`);
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
      {/* Header */}
      <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          className="rounded-xl size-8 shrink-0 hover:bg-muted"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">Starred Messages</h3>
          <p className="text-[11px] text-muted-foreground truncate">
            {messages.length} starred message{messages.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Starred Messages List */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2 space-y-2">
        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-amber-500" />
            <p className="text-xs">Loading starred messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center p-4 text-center text-muted-foreground">
            <div className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 mb-2">
              <Star className="size-6" />
            </div>
            <p className="text-xs font-semibold text-foreground">No starred messages</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Star important messages in any chat to view them here.
            </p>
          </div>
        ) : (
          messages.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenChat(item.conversation_id)}
              className="group relative flex flex-col gap-2 rounded-2xl border bg-card/70 p-3 hover:bg-muted/60 transition-all cursor-pointer shadow-2xs hover:border-primary/30"
            >
              {/* Sender & timestamp header */}
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="size-6 border shrink-0">
                    <AvatarImage src={item.sender_avatar || undefined} alt={item.sender_name} />
                    <AvatarFallback className="text-[9px] font-bold">
                      {getInitials(item.sender_name)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="truncate text-xs font-semibold text-foreground leading-tight">
                    {item.sender_name}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-muted-foreground">
                    {formatConversationTime(item.created_at)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => void handleUnstar(item, e)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                    title="Unstar message"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Message content */}
              {item.content && (
                <p className="line-clamp-3 text-xs text-foreground/90 leading-relaxed bg-muted/40 rounded-xl p-2 border border-border/50">
                  {item.content}
                </p>
              )}

              {/* Attachment snippet if present */}
              {item.attachment_name && (
                <div className="flex items-center gap-1.5 text-[11px] text-primary bg-primary/5 rounded-lg px-2 py-1">
                  <FileText className="size-3.5 shrink-0" />
                  <span className="truncate">{item.attachment_name}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
