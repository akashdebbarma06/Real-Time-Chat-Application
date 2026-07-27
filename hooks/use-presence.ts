"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PresencePayload {
  user_id: string;
  online_at: string;
}

export function usePresence(userId: string) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set([userId]));

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    const channel = supabase.channel("online-users", {
      config: { private: true, presence: { key: userId } },
    });

    async function connect() {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) await supabase.realtime.setAuth(data.session.access_token);

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState() as Record<string, PresencePayload[]>;
          const ids = new Set<string>();
          Object.values(state).flat().forEach((presence) => ids.add(presence.user_id));
          if (!cancelled) setOnlineUserIds(ids);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ user_id: userId, online_at: new Date().toISOString() });
          }
        });

      await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
      heartbeat = setInterval(() => {
        void supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
      }, 60_000);
    }

    void connect();

    return () => {
      cancelled = true;
      if (heartbeat) clearInterval(heartbeat);
      void supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return onlineUserIds;
}
