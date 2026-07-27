export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ConversationType = "direct" | "group";
export type MemberRole = "owner" | "admin" | "member";
export type MessageType = "text" | "image" | "file";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string;
          last_seen_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string;
          last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          type: ConversationType;
          name: string | null;
          avatar_url: string | null;
          direct_key: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: ConversationType;
          name?: string | null;
          avatar_url?: string | null;
          direct_key?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
        Relationships: [];
      };
      conversation_members: {
        Row: {
          conversation_id: string;
          user_id: string;
          role: MemberRole;
          joined_at: string;
          last_read_at: string | null;
          last_read_message_id: string | null;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          role?: MemberRole;
          joined_at?: string;
          last_read_at?: string | null;
          last_read_message_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["conversation_members"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
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
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content?: string;
          message_type?: MessageType;
          attachment_path?: string | null;
          attachment_name?: string | null;
          attachment_size?: number | null;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      message_reads: {
        Row: {
          message_id: string;
          user_id: string;
          read_at: string;
        };
        Insert: {
          message_id: string;
          user_id: string;
          read_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["message_reads"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_direct_conversation: {
        Args: { other_user: string };
        Returns: string;
      };
      create_group_conversation: {
        Args: { group_name: string; member_ids: string[] };
        Returns: string;
      };
      mark_conversation_read: {
        Args: { p_conversation_id: string; p_message_id: string };
        Returns: undefined;
      };
      get_conversation_summaries: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{
          id: string;
          type: ConversationType;
          name: string | null;
          avatar_url: string | null;
          updated_at: string;
          members: Json;
          last_message: Json | null;
          unread_count: number;
        }>;
      };
    };
    Enums: {
      conversation_type: ConversationType;
      member_role: MemberRole;
      message_type: MessageType;
    };
    CompositeTypes: Record<string, never>;
  };
}
