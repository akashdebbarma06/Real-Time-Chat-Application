import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { POST as ackDeliveryPOST } from "@/app/api/messages/ack-delivery/route";
import { POST as ackDownloadPOST } from "@/app/api/media/ack-download/route";

describe("Ephemeral Delivery Queue & Data Purge System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/messages/ack-delivery", () => {
    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("No session") }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const req = new Request("http://localhost:3000/api/messages/ack-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: "11111111-1111-4111-8111-111111111111" }),
      });

      const res = await ackDeliveryPOST(req as never);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Unauthorized");
    });

    it("rejects requests missing messageId parameter with 400 Bad Request", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const req = new Request("http://localhost:3000/api/messages/ack-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await ackDeliveryPOST(req as never);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Missing");
    });

    it("rejects invalid UUID formats with 400 Bad Request", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const req = new Request("http://localhost:3000/api/messages/ack-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: "not-a-valid-uuid" }),
      });

      const res = await ackDeliveryPOST(req as never);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Invalid message UUID");
    });

    it("returns 404 when target message is not found in delivery queue", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
        },
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const req = new Request("http://localhost:3000/api/messages/ack-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: "11111111-1111-4111-8111-111111111111" }),
      });

      const res = await ackDeliveryPOST(req as never);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain("No matching messages found");
    });

    it("returns 403 Forbidden for unauthorized acknowledgements (caller not in conversation)", async () => {
      const targetMsgId = "11111111-1111-4111-8111-111111111111";
      const convId = "22222222-2222-4222-8222-222222222222";

      const mockFrom = vi.fn((table: string) => {
        if (table === "messages") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: targetMsgId, conversation_id: convId }],
                error: null,
              }),
            }),
          };
        }
        if (table === "conversation_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [], // Caller is NOT a member of convId
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "intruder-user" } }, error: null }),
        },
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const req = new Request("http://localhost:3000/api/messages/ack-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: targetMsgId }),
      });

      const res = await ackDeliveryPOST(req as never);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Forbidden");
    });

    it("successfully purges message and returns 200 for authorized member acknowledgement", async () => {
      const targetMsgId = "11111111-1111-4111-8111-111111111111";
      const convId = "22222222-2222-4222-8222-222222222222";

      const mockFrom = vi.fn((table: string) => {
        if (table === "messages") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: targetMsgId, conversation_id: convId }],
                error: null,
              }),
            }),
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: [{ id: targetMsgId }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "conversation_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [{ conversation_id: convId }],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const mockRpc = vi.fn().mockResolvedValue({
        data: [targetMsgId],
        error: null,
      });

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "authorized-recipient" } }, error: null }),
        },
        from: mockFrom,
        rpc: mockRpc,
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const req = new Request("http://localhost:3000/api/messages/ack-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: targetMsgId }),
      });

      const res = await ackDeliveryPOST(req as never);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.purged).toBe(true);
      expect(json.purgedCount).toBe(1);
      expect(json.purgedIds).toContain(targetMsgId);
    });

    it("returns 500 and fails when database purge deletes 0 rows", async () => {
      const targetMsgId = "11111111-1111-4111-8111-111111111111";
      const convId = "22222222-2222-4222-8222-222222222222";

      const mockFrom = vi.fn((table: string) => {
        if (table === "messages") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: targetMsgId, conversation_id: convId }],
                error: null,
              }),
            }),
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: [], // 0 rows deleted
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "conversation_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [{ conversation_id: convId }],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: new Error("RPC error"),
      });

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "authorized-recipient" } }, error: null }),
        },
        from: mockFrom,
        rpc: mockRpc,
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const req = new Request("http://localhost:3000/api/messages/ack-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: targetMsgId }),
      });

      const res = await ackDeliveryPOST(req as never);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toContain("Message purge failed");
    });
  });

  describe("POST /api/media/ack-download", () => {
    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("No session") }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const req = new Request("http://localhost:3000/api/media/ack-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: "conv-101/sender-1/image.jpg" }),
      });

      const res = await ackDownloadPOST(req as never);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Unauthorized");
    });

    it("rejects requests missing mediaId parameter with 400 Bad Request", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const req = new Request("http://localhost:3000/api/media/ack-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await ackDownloadPOST(req as never);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Missing");
    });

    it("returns 403 Forbidden for unauthorized media download acknowledgement", async () => {
      const mediaPath = "22222222-2222-4222-8222-222222222222/sender-1/image.jpg";
      const convId = "22222222-2222-4222-8222-222222222222";

      const mockFrom = vi.fn((table: string) => {
        if (table === "messages") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: "msg-1", conversation_id: convId, attachment_path: mediaPath }],
                error: null,
              }),
            }),
          };
        }
        if (table === "conversation_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null, // Caller is NOT in conversation
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "unauthorized-user" } }, error: null }),
        },
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const req = new Request("http://localhost:3000/api/media/ack-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: mediaPath }),
      });

      const res = await ackDownloadPOST(req as never);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Forbidden");
    });

    it("successfully purges media and clears message attachment for authorized member", async () => {
      const mediaPath = "22222222-2222-4222-8222-222222222222/sender-1/image.jpg";
      const convId = "22222222-2222-4222-8222-222222222222";

      const mockRemove = vi.fn().mockResolvedValue({ data: [{ name: mediaPath }], error: null });

      const mockFrom = vi.fn((table: string) => {
        if (table === "messages") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: "msg-1", conversation_id: convId, attachment_path: mediaPath }],
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === "conversation_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "membership-1" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const mockRpc = vi.fn().mockResolvedValue({ data: true, error: null });

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "authorized-recipient" } }, error: null }),
        },
        from: mockFrom,
        storage: {
          from: vi.fn().mockReturnValue({
            remove: mockRemove,
          }),
        },
        rpc: mockRpc,
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const req = new Request("http://localhost:3000/api/media/ack-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: mediaPath }),
      });

      const res = await ackDownloadPOST(req as never);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.purged).toBe(true);
      expect(json.mediaId).toBe(mediaPath);
      expect(mockRemove).toHaveBeenCalledWith([mediaPath]);
    });

    it("returns 500 when storage removal fails", async () => {
      const mediaPath = "22222222-2222-4222-8222-222222222222/sender-1/image.jpg";
      const convId = "22222222-2222-4222-8222-222222222222";

      const mockRemove = vi.fn().mockResolvedValue({ data: null, error: new Error("Bucket access error") });

      const mockFrom = vi.fn((table: string) => {
        if (table === "messages") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: "msg-1", conversation_id: convId, attachment_path: mediaPath }],
                error: null,
              }),
            }),
          };
        }
        if (table === "conversation_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "membership-1" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "authorized-recipient" } }, error: null }),
        },
        from: mockFrom,
        storage: {
          from: vi.fn().mockReturnValue({
            remove: mockRemove,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const req = new Request("http://localhost:3000/api/media/ack-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: mediaPath }),
      });

      const res = await ackDownloadPOST(req as never);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toContain("Storage purge failed");
    });
  });

  describe("SQL Migration Policies & Functions Specification", () => {
    it("verifies 001_aether_chat.sql contains message delete and update policies for delivery acknowledgement", () => {
      const migrationPath = path.resolve(
        process.cwd(),
        "supabase/migrations/001_aether_chat.sql"
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain('create policy "Members can delete messages upon delivery acknowledgement"');
      expect(sql).toContain('create policy "Members can clear attachment paths upon delivery acknowledgement"');
      expect(sql).toContain('create policy "Members can purge conversation files upon delivery acknowledgement"');
    });

    it("verifies 001_aether_chat.sql defines security definer purge RPC functions", () => {
      const migrationPath = path.resolve(
        process.cwd(),
        "supabase/migrations/001_aether_chat.sql"
      );
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("function public.acknowledge_and_purge_messages");
      expect(sql).toContain("function public.acknowledge_and_purge_media");
      expect(sql).toContain("security definer");
    });
  });
});
