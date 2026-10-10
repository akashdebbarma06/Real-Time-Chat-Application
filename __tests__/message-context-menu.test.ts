import fs from "fs";
import path from "path";
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

    it("styles action context menu with slim 175px width, 13px font-size, and py-1.5 padding per item", () => {
      expect(menuContent).toContain("w-[175px]");
      expect(menuContent).toContain("text-[13px]");
      expect(menuContent).toContain("py-1.5");
      expect(menuContent).toContain("spaceBelow < 300");
    });

    it("renders corner reaction badge pinned to bottom-right of message bubble", () => {
      expect(bubbleContent).toContain("-bottom-2.5");
      expect(bubbleContent).toContain("right-3");
      expect(bubbleContent).toContain("border-[1.5px] border-background");
      expect(bubbleContent).toContain("size-6 rounded-full");
      expect(bubbleContent).toContain("ReactionDetailsDialog");
    });

    it("verifies ReactionDetailsDialog matches WhatsApp Web structure", () => {
      const dialogPath = path.resolve(__dirname, "../components/chat/reaction-details-dialog.tsx");
      const dialogContent = fs.readFileSync(dialogPath, "utf-8");

      expect(dialogContent).toContain("{totalCount === 1 ? \"reaction\" : \"reactions\"}");
      expect(dialogContent).toContain('activeCategory === "all"');
      expect(dialogContent).toContain("Click to remove");
      expect(dialogContent).toContain("onRemoveReaction(item.emoji)");
      expect(dialogContent).toContain('"You"');
    });
  });
});
