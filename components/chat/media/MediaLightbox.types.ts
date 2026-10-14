import type { ChatMessage } from "@/types/chat";

export interface MediaLightboxProps {
  open: boolean;
  activeMessageId: string | null;
  initialUrl?: string | null;
  conversationMediaMessages: ChatMessage[];
  currentUserId: string;
  conversationId: string;
  onClose: () => void;
  onReply?: (message: ChatMessage) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onForward?: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => void;
}

