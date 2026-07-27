import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getConversationAvatar, getConversationTitle, getInitials } from "@/lib/utils";
import type { ConversationSummary } from "@/types/chat";

export function ConversationAvatar({ conversation, userId, className }: { conversation: ConversationSummary; userId: string; className?: string }) {
  const title = getConversationTitle(conversation, userId);
  const avatar = getConversationAvatar(conversation, userId);
  return <Avatar className={className}><AvatarImage src={avatar || undefined} alt={title} /><AvatarFallback>{getInitials(title)}</AvatarFallback></Avatar>;
}
