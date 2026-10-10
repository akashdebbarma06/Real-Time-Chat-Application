"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, MessageSquare, Star, Trash2, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchFullStarredMessages,
  toggleMessageStar,
  type StarredMessageItem,
} from "@/lib/starred-store";
import { formatConversationTime, getInitials } from "@/lib/utils";

interface StarredMessagesDialogProps {
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StarredMessagesDialog({
  currentUserId,
  open,
  onOpenChange,
}: StarredMessagesDialogProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<StarredMessageItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !currentUserId) return;
    setLoading(true);
    fetchFullStarredMessages(currentUserId)
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [currentUserId, open]);

  async function handleUnstar(item: StarredMessageItem, e: React.MouseEvent) {
    e.stopPropagation();
    await toggleMessageStar(currentUserId, item.message_id, item.conversation_id);
    setMessages((prev) => prev.filter((m) => m.message_id !== item.message_id));
    toast.success("Message removed from Starred");
  }

  function handleOpenChat(conversationId: string) {
    if (!conversationId) return;
    onOpenChange(false);
    router.push(`/chat/${conversationId}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-6 rounded-3xl sm:rounded-3xl border shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2 text-left">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
              <Star className="size-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                Starred Messages
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Messages you have starred across all conversations.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-96 rounded-2xl border bg-card p-1">
          {loading ? (
            <div className="flex h-80 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-amber-500" />
              <p className="text-xs">Loading starred messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <div className="grid size-12 place-items-center rounded-2xl bg-muted/60 mb-3">
                <Star className="size-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-semibold text-foreground">No starred messages yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                Hover over any message in a chat and click the star icon to save it here for quick access later.
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-1">
              {messages.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenChat(item.conversation_id)}
                  className="group relative flex flex-col gap-2 rounded-2xl border border-muted/60 bg-muted/20 p-3.5 transition-all hover:bg-muted/60 hover:border-primary/30 cursor-pointer"
                >
                  {/* Top Bar: Sender & Chat title & Date */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="size-6 border shrink-0">
                        <AvatarImage src={item.sender_avatar || undefined} alt={item.sender_name} />
                        <AvatarFallback className="text-[9px]">
                          {getInitials(item.sender_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-xs font-semibold text-foreground">
                        {item.sender_name}
                      </span>
                      {item.conversation_name && (
                        <span className="truncate rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {item.conversation_name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <time className="text-[10px] text-muted-foreground">
                        {formatConversationTime(item.created_at)}
                      </time>
                      <button
                        type="button"
                        onClick={(e) => void handleUnstar(item, e)}
                        title="Unstar message"
                        className="rounded-lg p-1 text-muted-foreground hover:bg-background hover:text-amber-500 opacity-70 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Message Content */}
                  {item.content && (
                    <p className="text-xs text-foreground/90 leading-relaxed line-clamp-3 pl-8">
                      {item.content}
                    </p>
                  )}

                  {/* Attachment Preview if any */}
                  {item.attachment_name && (
                    <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2 text-xs border border-muted/50 ml-8">
                      <FileText className="size-4 text-primary shrink-0" />
                      <span className="truncate flex-1 text-muted-foreground">
                        {item.attachment_name}
                      </span>
                    </div>
                  )}

                  {/* Bottom hint */}
                  <div className="flex items-center justify-end text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      Open conversation →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
