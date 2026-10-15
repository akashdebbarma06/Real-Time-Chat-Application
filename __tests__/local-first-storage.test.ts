import { describe, expect, it, beforeEach } from "vitest";
import {
  saveLocalMessage,
  saveLocalMessages,
  getLocalMessages,
  getLocalMessagesPaginated,
  updateLocalMessageStatus,
  saveLocalMediaBlob,
  getLocalMediaBlob,
  hasLocalMedia,
  getAllLocalVaultMedia,
  getLocalVaultMediaPaginated,
  clearAllLocalData,
} from "@/lib/storage/local-db";
import type { ChatMessage } from "@/types/chat";

// Mock IndexedDB in JSDOM / Node environment
import "fake-indexeddb/auto";

describe("Local-First Storage Architecture Suite", () => {
  beforeEach(async () => {
    await clearAllLocalData();
  });

  const mockMessage: ChatMessage = {
    id: "msg-local-1",
    conversation_id: "conv-101",
    sender_id: "user-1",
    content: "Encrypted offline-first message test",
    message_type: "text",
    attachment_path: null,
    attachment_name: null,
    attachment_size: null,
    created_at: new Date().toISOString(),
    edited_at: null,
    deleted_at: null,
    sender: {
      id: "user-1",
      username: "akash",
      display_name: "Akash",
      avatar_url: null,
      bio: "Available",
      last_seen_at: new Date().toISOString(),
    },
    read_receipts: [],
    delivery_status: "sent",
  };

  it("stores and retrieves chat messages directly from client IndexedDB without backend", async () => {
    await saveLocalMessage(mockMessage);

    const retrieved = await getLocalMessages("conv-101");
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].id).toBe("msg-local-1");
    expect(retrieved[0].content).toBe("Encrypted offline-first message test");
    expect(retrieved[0].delivery_status).toBe("sent");
  });

  it("supports batch message persistence with chronological ordering", async () => {
    const msg1: ChatMessage = {
      ...mockMessage,
      id: "msg-1",
      created_at: new Date(Date.now() - 2000).toISOString(),
    };
    const msg2: ChatMessage = {
      ...mockMessage,
      id: "msg-2",
      created_at: new Date(Date.now() - 1000).toISOString(),
    };
    const msg3: ChatMessage = {
      ...mockMessage,
      id: "msg-3",
      created_at: new Date().toISOString(),
    };

    await saveLocalMessages([msg2, msg1, msg3]);

    const messages = await getLocalMessages("conv-101");
    expect(messages).toHaveLength(3);
    // Chronological ascending order
    expect(messages[0].id).toBe("msg-1");
    expect(messages[1].id).toBe("msg-2");
    expect(messages[2].id).toBe("msg-3");
  });

  it("supports cursor-based pagination with page boundaries and large histories", async () => {
    const baseTime = Date.now() - 100_000;
    const testMessages: ChatMessage[] = [];

    // Generate 25 messages spaced 1 second apart
    for (let i = 0; i < 25; i++) {
      testMessages.push({
        ...mockMessage,
        id: `msg-batch-${i.toString().padStart(2, "0")}`,
        content: `Message sequence #${i}`,
        created_at: new Date(baseTime + i * 1000).toISOString(),
      });
    }

    await saveLocalMessages(testMessages);

    // 1. Initial page: limit 10 (should return the 10 most recent messages, ordered chronologically ascending)
    const page1 = await getLocalMessagesPaginated("conv-101", { limit: 10 });
    expect(page1.messages).toHaveLength(10);
    expect(page1.hasMore).toBe(true);
    expect(page1.messages[0].id).toBe("msg-batch-15"); // oldest in page
    expect(page1.messages[9].id).toBe("msg-batch-24"); // newest in page
    expect(page1.oldestCreatedAt).toBe(testMessages[15].created_at);

    // 2. Second page: before oldest from page 1
    const page2 = await getLocalMessagesPaginated("conv-101", {
      limit: 10,
      beforeCreatedAt: page1.oldestCreatedAt!,
    });
    expect(page2.messages).toHaveLength(10);
    expect(page2.hasMore).toBe(true);
    expect(page2.messages[0].id).toBe("msg-batch-05");
    expect(page2.messages[9].id).toBe("msg-batch-14");

    // 3. Third page: remaining 5 messages
    const page3 = await getLocalMessagesPaginated("conv-101", {
      limit: 10,
      beforeCreatedAt: page2.oldestCreatedAt!,
    });
    expect(page3.messages).toHaveLength(5);
    expect(page3.hasMore).toBe(false);
    expect(page3.messages[0].id).toBe("msg-batch-00");
    expect(page3.messages[4].id).toBe("msg-batch-04");

    // 4. Verify total unique count and deduplication across pages
    const combined = [...page3.messages, ...page2.messages, ...page1.messages];
    const uniqueIds = new Set(combined.map((m) => m.id));
    expect(uniqueIds.size).toBe(25);
  });

  it("updates message delivery statuses (sent -> delivered -> read) locally", async () => {
    await saveLocalMessage(mockMessage);

    await updateLocalMessageStatus("msg-local-1", "delivered");
    let msgs = await getLocalMessages("conv-101");
    expect(msgs[0].delivery_status).toBe("delivered");

    await updateLocalMessageStatus("msg-local-1", "read");
    msgs = await getLocalMessages("conv-101");
    expect(msgs[0].delivery_status).toBe("read");
  });

  it("persists media binary Blobs directly in client IndexedDB storage", async () => {
    const fakeBinary = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header bytes
    const blob = new Blob([fakeBinary], { type: "image/png" });

    const mediaId = "media-attachment-photo-001";
    const blobUrl = await saveLocalMediaBlob(
      mediaId,
      "conv-101",
      "voice_photo.png",
      "image/png",
      blob,
      blob.size
    );

    expect(blobUrl).toBeTruthy();
    expect(blobUrl).toContain("blob:");

    // Verify retrieval
    const cached = await getLocalMediaBlob(mediaId);
    expect(cached).not.toBeNull();
    expect(cached?.record.size).toBe(blob.size);
    expect(cached?.record.name).toBe("voice_photo.png");

    const exists = await hasLocalMedia(mediaId);
    expect(exists).toBe(true);
  });

  it("supports paginated queries for local Device Vault feeds without full-memory load", async () => {
    const imgBlob1 = new Blob(["image-1"], { type: "image/jpeg" });
    const imgBlob2 = new Blob(["image-2"], { type: "image/jpeg" });
    const docBlob1 = new Blob(["doc-1"], { type: "application/pdf" });

    await saveLocalMediaBlob("media-img-1", "conv-1", "snap1.jpg", "image/jpeg", imgBlob1);
    await saveLocalMediaBlob("media-img-2", "conv-1", "snap2.jpg", "image/jpeg", imgBlob2);
    await saveLocalMediaBlob("doc-pdf-1", "conv-1", "agree.pdf", "application/pdf", docBlob1);

    const vaultAll = await getAllLocalVaultMedia();
    expect(vaultAll.media).toHaveLength(2);
    expect(vaultAll.docs).toHaveLength(1);

    const paginated = await getLocalVaultMediaPaginated({ limit: 1, offset: 0, category: "media" });
    expect(paginated.media).toHaveLength(1);
    expect(paginated.hasMore).toBe(true);
  });
});

describe("Ephemeral Backend Auto-Purge Delivery Queue Endpoints", () => {
  it("verifies media ACK download endpoint specification exists", async () => {
    const { POST } = await import("@/app/api/media/ack-download/route");
    expect(POST).toBeTypeOf("function");
  });

  it("verifies message delivery ACK endpoint specification exists", async () => {
    const { POST } = await import("@/app/api/messages/ack-delivery/route");
    expect(POST).toBeTypeOf("function");
  });
});

