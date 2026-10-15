"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPresenceChannel } from "@/lib/realtime";

interface PresencePayload {
  user_id?: string;
  online_at?: string;
}

// Minimum duration between database `profiles.last_seen_at` updates during continuous active sessions
const DB_UPDATE_THROTTLE_MS = 10 * 60 * 1000; // 10 minutes
// Debounce interval for tab visibility / focus switches to avoid burst database writes
const VISIBILITY_DEBOUNCE_MS = 500;
// In-memory Realtime presence ping interval (transient WebSocket only, 0 database load)
const REALTIME_TRACK_INTERVAL_MS = 60_000; // 60 seconds

export function usePresence(userId: string, roomId = "global") {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set([userId]));
  const lastDbWriteRef = useRef<number>(0);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let cancelled = false;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    // Use standardized presence:room:{roomId} channel with caller's authenticated userId
    const channel = getPresenceChannel(roomId, userId);

    function writeLastSeenToDb(force = false) {
      if (cancelled) return;
      const now = Date.now();
      if (!force && now - lastDbWriteRef.current < DB_UPDATE_THROTTLE_MS) {
        return;
      }
      lastDbWriteRef.current = now;
      void supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", userId);
    }

    async function syncPresence() {
      const state = channel.presenceState() as Record<string, PresencePayload[]>;
      const ids = new Set<string>();

      // Add self
      ids.add(userId);

      // Extract validated user IDs from presence state
      Object.entries(state).forEach(([key, presences]) => {
        if (Array.isArray(presences)) {
          presences.forEach((p) => {
            if (p?.user_id && p.user_id !== "global" && p.user_id !== roomId) {
              ids.add(p.user_id);
            }
          });
        } else if (key && key !== "global" && key !== roomId) {
          ids.add(key);
        }
      });

      if (!cancelled) {
        setOnlineUserIds(ids);
      }
    }

    async function connect() {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        await supabase.realtime.setAuth(data.session.access_token);
      }

      channel
        .on("presence", { event: "sync" }, syncPresence)
        .on("presence", { event: "join" }, syncPresence)
        .on("presence", { event: "leave" }, syncPresence)
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED" && !cancelled) {
            await channel.track({ user_id: userId, online_at: new Date().toISOString() });
          }
        });

      // Write initial last_seen_at on connect (forced)
      writeLastSeenToDb(true);

      // Heartbeat interval: maintain transient Realtime presence WebSocket state ONLY.
      // Does NOT flood PostgreSQL profiles.last_seen_at on every interval tick.
      heartbeat = setInterval(() => {
        if (cancelled) return;
        if (channel && document.visibilityState === "visible") {
          void channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
        // Throttled database update (at most once every 10 minutes)
        writeLastSeenToDb(false);
      }, REALTIME_TRACK_INTERVAL_MS);
    }

    void connect();

    // Re-track presence on window focus / tab visibility with debounce
    function handleVisibilityChange() {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        if (cancelled || !channel) return;

        if (document.visibilityState === "visible") {
          void channel.track({ user_id: userId, online_at: new Date().toISOString() });
          writeLastSeenToDb(false);
        } else if (document.visibilityState === "hidden") {
          void channel.untrack();
          // Immediately record accurate last-seen time when leaving the app
          writeLastSeenToDb(true);
        }
      }, VISIBILITY_DEBOUNCE_MS);
    }

    function handleOnline() {
      if (cancelled || !channel) return;
      void channel.track({ user_id: userId, online_at: new Date().toISOString() });
      writeLastSeenToDb(false);
    }

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      cancelled = true;
      if (heartbeat) clearInterval(heartbeat);
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);

      // Persist exact final last_seen_at upon unmount
      void supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", userId);

      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [userId, roomId]);

  return onlineUserIds;
}


