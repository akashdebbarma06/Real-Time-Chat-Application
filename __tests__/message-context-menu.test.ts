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

  describe("Message Context Menu Viewport Collision & Reaction Expansion", () => {
    const fs = require("fs");
    const path = require("path");

    const bubblePath = path.resolve(__dirname, "../components/chat/message-bubble.tsx");
    const bubbleContent = fs.readFileSync(bubblePath, "utf-8");

    const menuPath = path.resolve(__dirname, "../components/chat/message-context-menu.tsx");
    const menuContent = fs.readFileSync(menuPath, "utf-8");

    it("calculates spaceBelow against window.innerHeight and flips ABOVE if < 300px", () => {
      expect(bubbleContent).toContain("spaceBelow = window.innerHeight - rect.bottom");
      expect(bubbleContent).toContain('spaceBelow < 300');
      expect(bubbleContent).toContain('setMenuPlacement("top")');
    });

    it("clamps horizontal coordinates so the menu never bleeds outside viewport boundaries", () => {
      expect(menuContent).toContain("rect.right > viewportWidth - padding");
      expect(menuContent).toContain("rect.left < padding");
      expect(menuContent).toContain("setShiftX");
      expect(menuContent).toContain("transform: shiftX");
    });

    it("hides quick 6-icon strip and action list when reaction grid expands", () => {
      expect(menuContent).toContain("showFullPicker ? (");
      expect(menuContent).toContain("setShowFullPicker(false)");
      expect(menuContent).toContain("slide-in-from-top-2");
      expect(menuContent).toContain("zoom-in-95");
    });
  });
});
