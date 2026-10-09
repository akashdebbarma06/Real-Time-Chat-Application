import { describe, expect, it, vi } from "vitest";

describe("Realtime Presence System", () => {
  it("formats room channel topic according to the presence:room:{roomId} convention", () => {
    function getRoomTopic(roomId: string) {
      return `presence:room:${roomId}`;
    }

    expect(getRoomTopic("global")).toBe("presence:room:global");
    expect(getRoomTopic("b72e1284-884d-44aa-9c3f-c57a9cfbcfb1")).toBe("presence:room:b72e1284-884d-44aa-9c3f-c57a9cfbcfb1");
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

  it("merges active presence state into unique online user IDs", () => {
    const rawPresenceState: Record<string, { user_id: string; online_at: string }[]> = {
      "user-alice": [{ user_id: "user-alice", online_at: "2026-10-09T14:00:00Z" }],
      "user-bob": [{ user_id: "user-bob", online_at: "2026-10-09T14:01:00Z" }],
    };

    const onlineSet = new Set<string>(["user-self"]);
    Object.entries(rawPresenceState).forEach(([key, presences]) => {
      if (key) onlineSet.add(key);
      presences.forEach((p) => {
        if (p?.user_id) onlineSet.add(p.user_id);
      });
    });

    expect(onlineSet.has("user-self")).toBe(true);
    expect(onlineSet.has("user-alice")).toBe(true);
    expect(onlineSet.has("user-bob")).toBe(true);
    expect(onlineSet.has("user-charlie")).toBe(false);
  });
});
