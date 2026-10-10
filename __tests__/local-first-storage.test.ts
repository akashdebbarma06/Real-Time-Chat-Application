import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  saveLocalMessage,
  saveLocalMessages,
  getLocalMessages,
  updateLocalMessageStatus,
  saveLocalMediaBlob,
  getLocalMediaBlob,
  hasLocalMedia,
  getAllLocalVaultMedia,
  clearAllLocalData,
} from "@/lib/storage/local-db";
import type { ChatMessage } from "@/types/chat";

// Mock IndexedDB in JSDOM / Node environment
import "fake-indexeddb/auto";

describe("WhatsApp-Style Local-First Storage Architecture", () => {
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

  it("populates local Device Vault feeds from client-side stored media", async () => {
    const imgBlob = new Blob(["image-binary-data"], { type: "image/jpeg" });
    const docBlob = new Blob(["pdf-binary-data"], { type: "application/pdf" });

    await saveLocalMediaBlob("media-img-1", "conv-1", "snapshot.jpg", "image/jpeg", imgBlob);
    await saveLocalMediaBlob("doc-pdf-1", "conv-1", "agreement.pdf", "application/pdf", docBlob);

    const vault = await getAllLocalVaultMedia();
    expect(vault.media).toHaveLength(1);
    expect(vault.media[0].attachment_name).toBe("snapshot.jpg");
    expect(vault.docs).toHaveLength(1);
    expect(vault.docs[0].attachment_name).toBe("agreement.pdf");
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
