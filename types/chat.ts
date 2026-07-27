import type { ConversationType, MemberRole, MessageType } from "@/types/database";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  last_seen_at: string;
}

export interface ConversationMember {
  user_id: string;
  role: MemberRole;
  profile: Profile;
}

export interface LastMessage {
  id: string;
  content: string;
  message_type: MessageType;
  sender_id: string;
  created_at: string;
  read_receipts?: ReadReceipt[];
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  name: string | null;
  avatar_url: string | null;
  updated_at: string;
  members: ConversationMember[];
  last_message: LastMessage | null;
  unread_count: number;
}

export interface ReadReceipt {
  user_id: string;
  read_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  sender: Profile;
  read_receipts: ReadReceipt[];
}
