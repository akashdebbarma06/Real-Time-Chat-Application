import { describe, expect, it } from "vitest";
import { getLocalPinnedMessageIds, setLocalPinnedMessageIds, toggleMessagePin } from "@/lib/pinned-store";

describe("Message Pinning & Context Menu Store", () => {
  it("initializes empty set for conversation pins", () => {
    const ids = getLocalPinnedMessageIds("test-conv-1");
    expect(ids).toBeInstanceOf(Set);
    expect(ids.size).toBe(0);
  });

  it("toggles pinning a message on and off", () => {
    const convId = "test-conv-pin";
    const msgId = "msg-123";

    // Pin
    const res1 = toggleMessagePin(convId, msgId);
    expect(res1.isPinned).toBe(true);
    expect(getLocalPinnedMessageIds(convId).has(msgId)).toBe(true);

    // Unpin
    const res2 = toggleMessagePin(convId, msgId);
    expect(res2.isPinned).toBe(false);
    expect(getLocalPinnedMessageIds(convId).has(msgId)).toBe(false);
  });

  it("handles setting and retrieving multiple pinned messages", () => {
    const convId = "test-conv-multi";
    setLocalPinnedMessageIds(convId, new Set(["msg-1", "msg-2", "msg-3"]));

    const retrieved = getLocalPinnedMessageIds(convId);
    expect(retrieved.size).toBe(3);
    expect(retrieved.has("msg-1")).toBe(true);
    expect(retrieved.has("msg-2")).toBe(true);
    expect(retrieved.has("msg-3")).toBe(true);
  });
});
