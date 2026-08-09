import { describe, expect, it } from "vitest";
import {
  cn,
  formatFileSize,
  getConversationPeers,
  getConversationTitle,
  getInitials,
  sanitizeFilename,
} from "@/lib/utils";
import type { ConversationSummary, Profile } from "@/types/chat";

describe("Utility Functions", () => {
  describe("cn (tailwind merge)", () => {
    it("combines class names cleanly", () => {
      expect(cn("px-2", "py-2", "bg-red-500")).toBe("px-2 py-2 bg-red-500");
      expect(cn("p-4", "p-2")).toBe("p-2");
    });
  });

  describe("getInitials", () => {
    it("returns initials for a single or multi-word display name", () => {
      expect(getInitials("Akash Debbarma")).toBe("AD");
      expect(getInitials("Alice")).toBe("A");
      expect(getInitials(" John   Doe  ")).toBe("JD");
      expect(getInitials("")).toBe("CS");
    });
  });

  describe("formatFileSize", () => {
    it("formats bytes into human readable units", () => {
      expect(formatFileSize(500)).toBe("500 B");
      expect(formatFileSize(1024)).toBe("1.0 KB");
      expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
      expect(formatFileSize(null)).toBe("");
    });
  });

  describe("sanitizeFilename", () => {
    it("removes unsafe characters and limits length", () => {
      expect(sanitizeFilename("my picture!@#$%^.PNG")).toBe("my-picture.png");
      expect(sanitizeFilename("../../../etc/passwd")).toBe("file.etcpasswd");
      expect(sanitizeFilename("script.exe")).toBe("script.exe");
    });
  });

  describe("Conversation Helpers", () => {
    const userA: Profile = {
      id: "user-1",
      username: "user1",
      display_name: "User One",
      avatar_url: null,
      bio: "",
      last_seen_at: new Date().toISOString(),
    };

    const userB: Profile = {
      id: "user-2",
      username: "user2",
      display_name: "User Two",
      avatar_url: null,
      bio: "",
      last_seen_at: new Date().toISOString(),
    };

    const directConv: ConversationSummary = {
      id: "conv-1",
      type: "direct",
      name: null,
      avatar_url: null,
      updated_at: new Date().toISOString(),
      members: [
        { user_id: "user-1", role: "owner", profile: userA },
        { user_id: "user-2", role: "member", profile: userB },
      ],
      last_message: null,
      unread_count: 0,
    };

    const groupConv: ConversationSummary = {
      id: "conv-2",
      type: "group",
      name: "Engineering Team",
      avatar_url: null,
      updated_at: new Date().toISOString(),
      members: [
        { user_id: "user-1", role: "owner", profile: userA },
        { user_id: "user-2", role: "admin", profile: userB },
      ],
      last_message: null,
      unread_count: 2,
    };

    it("resolves title correctly for direct and group conversations", () => {
      expect(getConversationTitle(directConv, "user-1")).toBe("User Two");
      expect(getConversationTitle(directConv, "user-2")).toBe("User One");
      expect(getConversationTitle(groupConv, "user-1")).toBe("Engineering Team");
    });

    it("extracts peer profiles excluding current user", () => {
      const peers = getConversationPeers(directConv, "user-1");
      expect(peers).toHaveLength(1);
      expect(peers[0].id).toBe("user-2");
    });
  });
});
