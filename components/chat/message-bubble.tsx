import { Check, CheckCheck } from "lucide-react";
import { AttachmentPreview } from "@/components/chat/attachment-preview";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatMessageTime, getInitials } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId: string;
  showSenderName: boolean;
  showReceipt: boolean;
}

export function MessageBubble({ message, currentUserId, showSenderName, showReceipt }: MessageBubbleProps) {
  const own = message.sender_id === currentUserId;
  const readBySomeoneElse = message.read_receipts.some((receipt) => receipt.user_id !== currentUserId);

  return (
    <div className={cn("flex items-end gap-2", own ? "justify-end" : "justify-start")}>
      {!own && <Avatar className="size-8"><AvatarImage src={message.sender.avatar_url || undefined} alt={message.sender.display_name} /><AvatarFallback>{getInitials(message.sender.display_name)}</AvatarFallback></Avatar>}
      <div className={cn("max-w-[82%] sm:max-w-[72%]", own && "items-end")}>
        {showSenderName && !own && <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">{message.sender.display_name}</p>}
        <div className={cn("rounded-2xl px-3.5 py-2.5 shadow-sm", own ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border bg-card")}>
          {message.content && <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>}
          {message.attachment_path && <AttachmentPreview message={message} />}
          <div className={cn("mt-1 flex items-center justify-end gap-1 text-[10px]", own ? "text-primary-foreground/70" : "text-muted-foreground")}>
            <time>{formatMessageTime(message.created_at)}</time>
            {message.edited_at && <span>· edited</span>}
            {own && showReceipt && (readBySomeoneElse ? <CheckCheck className="size-3.5" aria-label="Read" /> : <Check className="size-3.5" aria-label="Sent" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
