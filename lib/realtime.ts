import { createClient } from "@/lib/supabase/client";

/**
 * Returns a standardized Supabase realtime channel for presence tracking.
 * Convention: `presence:room:{roomId}`
 *
 * @param roomId Unique identifier for the room or scope (e.g. conversationId or "global")
 * @param userId Authenticated user's ID to prevent impersonation of other users' presence state
 */
export function getPresenceChannel(roomId = "global", userId?: string) {
  const supabase = createClient();
  return supabase.channel(`presence:room:${roomId}`, {
    config: {
      private: true,
      presence: { key: userId || undefined },
    },
  });
}

