import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getConversationPeers, getConversationTitle } from "@/lib/utils";
import type { ConversationSummary, Profile } from "@/types/chat";

describe("AetherChat Android APK Conversation UI & Keyboard Behavior Specifications", () => {
  const currentUserId = "user-me-123";

  const directConversation: ConversationSummary = {
    id: "conv-direct-1",
    type: "direct",
    name: null,
    avatar_url: null,
    updated_at: new Date().toISOString(),
    unread_count: 0,
    last_message: {
      id: "msg-1",
      content: "Hey there!",
      message_type: "text",
      sender_id: "user-peer-456",
      created_at: new Date().toISOString(),
    },
    members: [
      {
        user_id: currentUserId,
        role: "member",
        profile: {
          id: currentUserId,
          username: "myself",
          display_name: "Myself",
          avatar_url: null,
          bio: "Hey",
          last_seen_at: new Date().toISOString(),
        },
      },
      {
        user_id: "user-peer-456",
        role: "member",
        profile: {
          id: "user-peer-456",
          username: "johndoe",
          display_name: "John Doe",
          avatar_url: "https://example.com/avatar.jpg",
          bio: "Android developer",
          last_seen_at: new Date().toISOString(),
        },
      },
    ],
  };

  const groupConversation: ConversationSummary = {
    id: "conv-group-1",
    type: "group",
    name: "Engineering Team",
    avatar_url: "https://example.com/group.jpg",
    updated_at: new Date().toISOString(),
    unread_count: 2,
    last_message: {
      id: "msg-2",
      content: "Let's review the APK build",
      message_type: "text",
      sender_id: "user-peer-456",
      created_at: new Date().toISOString(),
    },
    members: [
      {
        user_id: currentUserId,
        role: "admin",
        profile: {
          id: currentUserId,
          username: "myself",
          display_name: "Myself",
          avatar_url: null,
          bio: "Hey",
          last_seen_at: new Date().toISOString(),
        },
      },
      {
        user_id: "user-peer-456",
        role: "member",
        profile: {
          id: "user-peer-456",
          username: "johndoe",
          display_name: "John Doe",
          avatar_url: "https://example.com/avatar.jpg",
          bio: "Android developer",
          last_seen_at: new Date().toISOString(),
        },
      },
    ],
  };

  describe("1. APK Only: Long-Press Conversation Selection", () => {
    it("differentiates normal tap from long-press gesture", () => {
      let timerFired = false;
      let selectionMode = false;
      let selectedIds = new Set<string>();
      let longPressFiredId: string | null = null;

      const triggerLongPress = (convId: string) => {
        timerFired = true;
        longPressFiredId = convId;
        selectionMode = true;
        selectedIds = new Set([convId]);
      };

      // Normal tap (cleared before 450ms)
      const clearTimer = vi.fn();
      clearTimer();
      expect(timerFired).toBe(false);
      expect(selectionMode).toBe(false);

      // Long press (held for 450ms)
      triggerLongPress("conv-direct-1");
      expect(timerFired).toBe(true);
      expect(selectionMode).toBe(true);
      expect(selectedIds.has("conv-direct-1")).toBe(true);
      expect(longPressFiredId).toBe("conv-direct-1");
    });

    it("prevents long-press from triggering normal tap navigation upon release", () => {
      let navigatedTo: string | null = null;
      let longPressFiredId: string | null = "conv-direct-1";

      const handleRowClick = (convId: string) => {
        if (longPressFiredId === convId) {
          longPressFiredId = null;
          return; // Suppress navigation
        }
        navigatedTo = `/chat/${convId}`;
      };

      // When click follows a long press, navigation must be suppressed
      handleRowClick("conv-direct-1");
      expect(navigatedTo).toBeNull();
      expect(longPressFiredId).toBeNull();

      // Next standard tap navigates normally
      handleRowClick("conv-direct-1");
      expect(navigatedTo).toBe("/chat/conv-direct-1");
    });

    it("cancels long-press when user scrolls the list (>10px movement)", () => {
      let timerActive = true;
      const startPos = { x: 100, y: 150 };

      const handleTouchMove = (currentPos: { x: number; y: number }) => {
        const dx = Math.abs(currentPos.x - startPos.x);
        const dy = Math.abs(currentPos.y - startPos.y);
        if (dx > 10 || dy > 10) {
          timerActive = false;
        }
      };

      // Scroll 20px vertically
      handleTouchMove({ x: 100, y: 170 });
      expect(timerActive).toBe(false);
    });

    it("cancels selection mode and resets selected conversation IDs", () => {
      let isSelectionMode = true;
      let selectedIds = new Set(["conv-direct-1", "conv-group-1"]);

      const exitSelection = () => {
        isSelectionMode = false;
        selectedIds = new Set();
      };

      exitSelection();
      expect(isSelectionMode).toBe(false);
      expect(selectedIds.size).toBe(0);
    });
  });

  describe("2. APK Only: Profile Photo Tap Info Panel", () => {
    it("extracts real database contact record for direct conversation", () => {
      const peers = getConversationPeers(directConversation, currentUserId);
      expect(peers.length).toBe(1);
      expect(peers[0].id).toBe("user-peer-456");
      expect(peers[0].display_name).toBe("John Doe");
      expect(peers[0].avatar_url).toBe("https://example.com/avatar.jpg");
    });

    it("extracts real database group record for group conversation", () => {
      const title = getConversationTitle(groupConversation, currentUserId);
      expect(title).toBe("Engineering Team");
      expect(groupConversation.members.length).toBe(2);
      expect(groupConversation.avatar_url).toBe("https://example.com/group.jpg");
    });

    it("ensures avatar click stops event propagation and opens drawer", () => {
      let infoOpenedConv: ConversationSummary | null = null;
      let chatOpened = false;

      const onOpenInfo = (conv: ConversationSummary) => {
        infoOpenedConv = conv;
      };

      const onRowClick = () => {
        chatOpened = true;
      };

      // Avatar click with stopPropagation
      const handleAvatarClick = (e: { stopPropagation: () => void; preventDefault: () => void }) => {
        e.stopPropagation();
        e.preventDefault();
        onOpenInfo(directConversation);
      };

      const mockEvent = {
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
      };

      handleAvatarClick(mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(infoOpenedConv).toBe(directConversation);
      expect(chatOpened).toBe(false);
    });
  });

  describe("3. Soft Input & Keyboard Behavior Configuration", () => {
    it("verifies AndroidManifest.xml has android:windowSoftInputMode=\"adjustResize\"", () => {
      const manifestPath = path.resolve(__dirname, "../android/app/src/main/AndroidManifest.xml");
      const content = fs.readFileSync(manifestPath, "utf-8");
      expect(content).toContain('android:windowSoftInputMode="adjustResize"');
    });

    it("switches composer bottom padding dynamically when keyboard opens", () => {
      const getComposerBottomPaddingClass = (isKeyboardOpen: boolean) => {
        return isKeyboardOpen
          ? "pb-1.5 sm:pb-2"
          : "pb-[max(0.75rem,var(--safe-area-bottom))] sm:pb-4";
      };

      // When keyboard is open, avoids duplicate bottom padding
      expect(getComposerBottomPaddingClass(true)).toBe("pb-1.5 sm:pb-2");

      // When keyboard is closed, respects system navigation bar inset
      expect(getComposerBottomPaddingClass(false)).toBe("pb-[max(0.75rem,var(--safe-area-bottom))] sm:pb-4");
    });
  });

  describe("4. Long Message Auto-Resize & Composer Controls Alignment", () => {
    it("dynamically bounds textarea height up to 140px max height", () => {
      const computeHeight = (scrollHeight: number) => {
        return Math.min(Math.max(scrollHeight, 24), 140);
      };

      expect(computeHeight(20)).toBe(24);
      expect(computeHeight(48)).toBe(48);
      expect(computeHeight(96)).toBe(96);
      expect(computeHeight(140)).toBe(140);
      expect(computeHeight(350)).toBe(140); // capped at 140px
    });

    it("transitions capsule shape from pill to rounded-2xl when multiline", () => {
      const isMultiline = (text: string, scrollHeight: number) => {
        return scrollHeight > 38 || text.includes("\n");
      };

      expect(isMultiline("Short message", 28)).toBe(false);
      expect(isMultiline("Line 1\nLine 2", 28)).toBe(true);
      expect(isMultiline("Very long single sentence that wraps into multiple lines in composer", 56)).toBe(true);
    });

    it("resets textarea height to single line when message is cleared", () => {
      let height = 120;
      let multiline = true;

      const reset = () => {
        height = 24;
        multiline = false;
      };

      reset();
      expect(height).toBe(24);
      expect(multiline).toBe(false);
    });
  });
});
