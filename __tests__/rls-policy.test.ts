import { describe, expect, it } from "vitest";

/**
 * Mock implementation verifying the logic behind Supabase RLS policies in 001_chatsphere.sql:
 * - is_conversation_member(p_conversation_id, p_user_id)
 * - direct_key format least(u1, u2) || ':' || greatest(u1, u2)
 */

function generateDirectKey(userA: string, userB: string): string {
  const sorted = [userA, userB].sort();
  return `${sorted[0]}:${sorted[1]}`;
}

function checkIsMember(
  conversationMembers: { conversationId: string; userId: string }[],
  targetConvId: string,
  userId: string
): boolean {
  return conversationMembers.some(
    (m) => m.conversationId === targetConvId && m.userId === userId
  );
}

describe("Security & RLS Authorization Rules", () => {
  describe("Direct Key Generation (One-to-One Unique Key)", () => {
    it("produces identical direct_key regardless of user ordering to enforce single direct conversation", () => {
      const key1 = generateDirectKey("uuid-alice-123", "uuid-bob-456");
      const key2 = generateDirectKey("uuid-bob-456", "uuid-alice-123");

      expect(key1).toBe("uuid-alice-123:uuid-bob-456");
      expect(key1).toBe(key2);
    });
  });

  describe("Row Level Security Member Guard (is_conversation_member)", () => {
    const membershipDb = [
      { conversationId: "conv-1", userId: "user-alice" },
      { conversationId: "conv-1", userId: "user-bob" },
      { conversationId: "conv-2", userId: "user-charlie" },
    ];

    it("allows members of the conversation to access messages", () => {
      expect(checkIsMember(membershipDb, "conv-1", "user-alice")).toBe(true);
      expect(checkIsMember(membershipDb, "conv-1", "user-bob")).toBe(true);
    });

    it("denies non-members from accessing conversation messages or presence", () => {
      expect(checkIsMember(membershipDb, "conv-1", "user-charlie")).toBe(false);
      expect(checkIsMember(membershipDb, "conv-2", "user-alice")).toBe(false);
    });
  });
});
