"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PresencePayload {
  user_id?: string;
  online_at?: string;
}

export function usePresence(userId: string) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set([userId]));

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let cancelled = false;
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    // Use global public presence channel for instant cross-client tracking
    const channel = supabase.channel("global-online-presence", {
      config: { presence: { key: userId } },
    });

    async function syncPresence() {
      const state = channel.presenceState() as Record<string, PresencePayload[]>;
      const ids = new Set<string>();

      // Add self
      ids.add(userId);

      // Extract all active user IDs from presence keys and payload items
      Object.entries(state).forEach(([key, presences]) => {
        if (key) ids.add(key);
        if (Array.isArray(presences)) {
          presences.forEach((p) => {
            if (p?.user_id) ids.add(p.user_id);
          });
        }
      });

      if (!cancelled) {
        setOnlineUserIds(ids);
      }
    }

    async function connect() {
      channel
        .on("presence", { event: "sync" }, syncPresence)
        .on("presence", { event: "join" }, syncPresence)
        .on("presence", { event: "leave" }, syncPresence)
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ user_id: userId, online_at: new Date().toISOString() });
          }
        });

      // Update last_seen_at timestamp in database
      void supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);

      // Heartbeat interval every 30 seconds
      heartbeat = setInterval(() => {
        void supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
        if (channel) {
          void channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      }, 30_000);
    }

    void connect();

    // Re-track presence on window focus / tab visibility
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && channel) {
        void channel.track({ user_id: userId, online_at: new Date().toISOString() });
        void supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
      }
    }

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      cancelled = true;
      if (heartbeat) clearInterval(heartbeat);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      void supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return onlineUserIds;
}
