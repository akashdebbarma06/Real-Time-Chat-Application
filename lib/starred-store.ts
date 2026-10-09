"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface StarredMessageItem {
  id: string;
  message_id: string;
  conversation_id: string;
  created_at: string;
  content: string;
  attachment_name?: string | null;
  attachment_path?: string | null;
  sender_id: string;
  sender_name: string;
  sender_username: string;
  sender_avatar?: string | null;
  conversation_name?: string | null;
}

const STARRED_EVENT = "aether_starred_messages_updated";

function getLocalKey(userId: string) {
  return `aether_starred_${userId}`;
}

export function getLocalStarredIds(userId: string): Set<string> {
  if (typeof window === "undefined" || !userId) return new Set();
  try {
    const raw = localStorage.getItem(getLocalKey(userId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function setLocalStarredIds(userId: string, ids: Set<string>) {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(getLocalKey(userId), JSON.stringify([...ids]));
    window.dispatchEvent(new CustomEvent(STARRED_EVENT, { detail: { userId } }));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Fetch all starred message IDs for the current user from database,
 * falling back to local storage cache if table is not yet migrated.
 */
export async function fetchUserStarredIds(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();
  const localSet = getLocalStarredIds(userId);

  try {
    const supabase = createClient();
    const { data, error } = await (supabase.from("starred_messages" as any) as any)
      .select("message_id")
      .eq("user_id", userId);

    if (error) {
      return localSet;
    }

    const dbSet = new Set<string>((data || []).map((row: { message_id: string }) => String(row.message_id)));
    // Merge and save cache
    const merged = new Set<string>([...localSet, ...dbSet]);
    setLocalStarredIds(userId, merged);
    return merged;
  } catch {
    return localSet;
  }
}

/**
 * Toggle starring of an individual message in database and local cache.
 */
export async function toggleMessageStar(
  userId: string,
  messageId: string,
  conversationId: string,
  metadata?: {
    content?: string;
    attachment_name?: string | null;
    attachment_path?: string | null;
    sender_name?: string;
    sender_username?: string;
    sender_avatar?: string | null;
  }
): Promise<{ isStarred: boolean; error?: string }> {
  if (!userId || !messageId) return { isStarred: false, error: "Invalid parameters" };

  const currentSet = getLocalStarredIds(userId);
  const currentlyStarred = currentSet.has(messageId);
  const nextStarred = !currentlyStarred;

  // Optimistic update locally
  if (nextStarred) {
    currentSet.add(messageId);
    if (metadata) {
      try {
        const metaKey = `aether_starred_meta_${userId}_${messageId}`;
        localStorage.setItem(metaKey, JSON.stringify({ ...metadata, conversationId, messageId }));
      } catch {}
    }
  } else {
    currentSet.delete(messageId);
    try {
      localStorage.removeItem(`aether_starred_meta_${userId}_${messageId}`);
    } catch {}
  }
  setLocalStarredIds(userId, currentSet);

  // Persist to Supabase
  try {
    const supabase = createClient();
    const table = supabase.from("starred_messages" as any) as any;
    if (nextStarred) {
      const { error } = await table.insert({
        user_id: userId,
        message_id: messageId,
        conversation_id: conversationId,
      });
      if (error && error.code !== "42P01" && error.code !== "23505") {
        console.warn("Could not persist starred message to database:", error.message);
      }
    } else {
      const { error } = await table
        .delete()
        .eq("user_id", userId)
        .eq("message_id", messageId);
      if (error && error.code !== "42P01") {
        console.warn("Could not remove starred message from database:", error.message);
      }
    }
  } catch (err) {
    console.warn("Database star error:", err);
  }

  return { isStarred: nextStarred };
}

/**
 * Fetch full details of all starred messages for the user.
 */
export async function fetchFullStarredMessages(userId: string): Promise<StarredMessageItem[]> {
  if (!userId) return [];

  try {
    const supabase = createClient();
    const { data, error } = await (supabase.from("starred_messages" as any) as any)
      .select(`
        id,
        message_id,
        conversation_id,
        created_at,
        messages:message_id (
          id,
          content,
          created_at,
          attachment_name,
          attachment_path,
          sender_id,
          sender:profiles!sender_id (
            id,
            display_name,
            username,
            avatar_url
          )
        ),
        conversations:conversation_id (
          id,
          name,
          type
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row: any) => {
        const msg = row.messages || {};
        const sender = msg.sender || {};
        const conv = row.conversations || {};
        return {
          id: row.id || row.message_id,
          message_id: row.message_id,
          conversation_id: row.conversation_id,
          created_at: msg.created_at || row.created_at,
          content: msg.content || "",
          attachment_name: msg.attachment_name,
          attachment_path: msg.attachment_path,
          sender_id: sender.id || msg.sender_id || "",
          sender_name: sender.display_name || "Unknown",
          sender_username: sender.username || "",
          sender_avatar: sender.avatar_url,
          conversation_name: conv.name || (conv.type === "direct" ? "Direct Chat" : "Group Chat"),
        };
      });
    }
  } catch (err) {
    console.warn("Error fetching starred messages from Supabase:", err);
  }

  // Fallback to local storage
  const localIds = getLocalStarredIds(userId);
  const results: StarredMessageItem[] = [];

  for (const msgId of localIds) {
    try {
      const meta = localStorage.getItem(`aether_starred_meta_${userId}_${msgId}`);
      if (meta) {
        const parsed = JSON.parse(meta);
        results.push({
          id: msgId,
          message_id: msgId,
          conversation_id: parsed.conversationId || "",
          created_at: new Date().toISOString(),
          content: parsed.content || "",
          attachment_name: parsed.attachment_name,
          attachment_path: parsed.attachment_path,
          sender_id: "",
          sender_name: parsed.sender_name || "User",
          sender_username: parsed.sender_username || "",
          sender_avatar: parsed.sender_avatar,
          conversation_name: "Chat",
        });
      }
    } catch {}
  }

  return results;
}

/**
 * Hook to reactively observe starred status of messages.
 */
export function useStarredIds(userId: string) {
  const [starredIds, setStarredIds] = useState<Set<string>>(() => getLocalStarredIds(userId));

  useEffect(() => {
    if (!userId) return;

    // Load from DB
    fetchUserStarredIds(userId).then(setStarredIds);

    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ userId: string }>;
      if (!custom.detail || custom.detail.userId === userId) {
        setStarredIds(getLocalStarredIds(userId));
      }
    };

    window.addEventListener(STARRED_EVENT, handler);
    return () => window.removeEventListener(STARRED_EVENT, handler);
  }, [userId]);

  return starredIds;
}
