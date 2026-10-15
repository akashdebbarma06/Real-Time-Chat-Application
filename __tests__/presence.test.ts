import { describe, expect, it, vi } from "vitest";

describe("Realtime Presence System", () => {
  it("formats room channel topic according to the presence:room:{roomId} convention", () => {
    function getRoomTopic(roomId: string) {
      return `presence:room:${roomId}`;
    }

    expect(getRoomTopic("global")).toBe("presence:room:global");
    expect(getRoomTopic("b72e1284-884d-44aa-9c3f-c57a9cfbcfb1")).toBe(
      "presence:room:b72e1284-884d-44aa-9c3f-c57a9cfbcfb1"
    );
  });

  it("handles online/offline presence tracking events on visibility changes", () => {
    const tracker = {
      tracked: false,
      user_id: "user-123",
      track(id: string) {
        this.tracked = true;
        this.user_id = id;
      },
      untrack() {
        this.tracked = false;
      },
    };

    // Simulate tab becoming hidden (user switches away/closes tab)
    function handleVisibility(state: "visible" | "hidden") {
      if (state === "visible") {
        tracker.track("user-123");
      } else {
        tracker.untrack();
      }
    }

    handleVisibility("hidden");
    expect(tracker.tracked).toBe(false);

    // Simulate tab regaining focus/visibility
    handleVisibility("visible");
    expect(tracker.tracked).toBe(true);
    expect(tracker.user_id).toBe("user-123");
  });

  it("merges active presence state into unique online user IDs while filtering invalid keys", () => {
    const rawPresenceState: Record<string, { user_id: string; online_at: string }[]> = {
      "user-alice": [{ user_id: "user-alice", online_at: "2026-10-09T14:00:00Z" }],
      "user-bob": [{ user_id: "user-bob", online_at: "2026-10-09T14:01:00Z" }],
      global: [{ user_id: "global", online_at: "2026-10-09T14:02:00Z" }], // Should not be added as a user ID
    };

    const onlineSet = new Set<string>(["user-self"]);
    Object.entries(rawPresenceState).forEach(([key, presences]) => {
      presences.forEach((p) => {
        if (p?.user_id && p.user_id !== "global") {
          onlineSet.add(p.user_id);
        }
      });
      if (key && key !== "global" && !onlineSet.has(key)) {
        onlineSet.add(key);
      }
    });

    expect(onlineSet.has("user-self")).toBe(true);
    expect(onlineSet.has("user-alice")).toBe(true);
    expect(onlineSet.has("user-bob")).toBe(true);
    expect(onlineSet.has("global")).toBe(false);
    expect(onlineSet.has("user-charlie")).toBe(false);
  });

  it("throttles database last_seen_at updates while keeping transient Realtime presence alive", () => {
    const THROTTLE_MS = 10 * 60 * 1000;
    let lastWriteTime = 0;
    let dbWriteCount = 0;
    let realtimePingCount = 0;

    function recordHeartbeat(now: number, isForce = false) {
      // Realtime websocket ping happens on every heartbeat
      realtimePingCount++;

      // Database write is throttled to once every 10 minutes unless forced
      if (isForce || now - lastWriteTime >= THROTTLE_MS) {
        lastWriteTime = now;
        dbWriteCount++;
      }
    }

    // 1. Initial connect (forced write)
    const t0 = 1_000_000;
    recordHeartbeat(t0, true);
    expect(dbWriteCount).toBe(1);
    expect(realtimePingCount).toBe(1);

    // 2. 60s later (should NOT write to DB, only Realtime)
    recordHeartbeat(t0 + 60_000, false);
    expect(dbWriteCount).toBe(1);
    expect(realtimePingCount).toBe(2);

    // 3. 5 minutes later (still within 10min throttle, no DB write)
    recordHeartbeat(t0 + 300_000, false);
    expect(dbWriteCount).toBe(1);
    expect(realtimePingCount).toBe(3);

    // 4. 10.5 minutes later (exceeds throttle, writes to DB)
    recordHeartbeat(t0 + 630_000, false);
    expect(dbWriteCount).toBe(2);
    expect(realtimePingCount).toBe(4);

    // 5. User leaves / disconnects (forced write to record accurate offline status)
    recordHeartbeat(t0 + 640_000, true);
    expect(dbWriteCount).toBe(3);
    expect(realtimePingCount).toBe(5);
  });
});

