import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { ChatMessage, ConversationSummary, MessageDeliveryStatus } from "@/types/chat";
import type { VaultMediaItem, VaultLinkItem } from "@/components/chat/vault-view";

export interface StoredMediaRecord {
  id: string; // mediaId / attachment_path
  mediaId: string;
  conversationId: string;
  name: string;
  type: string;
  blob: Blob;
  size: number;
  createdAt: string;
}

interface AetherLocalDBSchema extends DBSchema {
  conversations: {
    key: string;
    value: ConversationSummary;
    indexes: { "by-updated": string };
  };
  messages: {
    key: string;
    value: ChatMessage;
    indexes: {
      "by-conversation": string;
      "by-created": string;
    };
  };
  media: {
    key: string;
    value: StoredMediaRecord;
    indexes: {
      "by-conversation": string;
      "by-created": string;
    };
  };
}

const DB_NAME = "aether_client_storage_v1";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AetherLocalDBSchema>> | null = null;
const blobUrlCache = new Map<string, string>();

function safeCreateObjectURL(blob: Blob): string {
  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    return URL.createObjectURL(blob);
  }
  return `blob:client-local/${Math.random().toString(36).substring(2, 9)}`;
}

function safeRevokeObjectURL(url: string): void {
  if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }
}

/**
 * Get or initialize client-side IndexedDB instance.
 * Safe for Server-Side Rendering (returns null on server).
 */
export async function getLocalDB(): Promise<IDBPDatabase<AetherLocalDBSchema> | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB<AetherLocalDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 1. Conversations store
        if (!db.objectStoreNames.contains("conversations")) {
          const convStore = db.createObjectStore("conversations", { keyPath: "id" });
          convStore.createIndex("by-updated", "updated_at");
        }

        // 2. Messages store
        if (!db.objectStoreNames.contains("messages")) {
          const msgStore = db.createObjectStore("messages", { keyPath: "id" });
          msgStore.createIndex("by-conversation", "conversation_id");
          msgStore.createIndex("by-created", "created_at");
        }

        // 3. Media binary Blobs store
        if (!db.objectStoreNames.contains("media")) {
          const mediaStore = db.createObjectStore("media", { keyPath: "id" });
          mediaStore.createIndex("by-conversation", "conversationId");
          mediaStore.createIndex("by-created", "createdAt");
        }
      },
    });
  }

  return dbPromise;
}

/* ─────────────────────────────────────────────────────────────
   1. CONVERSATIONS STORAGE
   ───────────────────────────────────────────────────────────── */

export async function saveLocalConversation(conv: ConversationSummary): Promise<void> {
  const db = await getLocalDB();
  if (!db) return;
  await db.put("conversations", conv);
}

export async function saveLocalConversations(convs: ConversationSummary[]): Promise<void> {
  const db = await getLocalDB();
  if (!db || convs.length === 0) return;
  const tx = db.transaction("conversations", "readwrite");
  for (const conv of convs) {
    await tx.store.put(conv);
  }
  await tx.done;
}

export async function getLocalConversations(): Promise<ConversationSummary[]> {
  const db = await getLocalDB();
  if (!db) return [];
  const list = await db.getAllFromIndex("conversations", "by-updated");
  return list.reverse();
}

/* ─────────────────────────────────────────────────────────────
   2. MESSAGES STORAGE (WhatsApp-Style Local First)
   ───────────────────────────────────────────────────────────── */

export async function saveLocalMessage(msg: ChatMessage): Promise<void> {
  const db = await getLocalDB();
  if (!db) return;
  await db.put("messages", msg);
}

export async function saveLocalMessages(msgs: ChatMessage[]): Promise<void> {
  const db = await getLocalDB();
  if (!db || msgs.length === 0) return;
  const tx = db.transaction("messages", "readwrite");
  for (const msg of msgs) {
    await tx.store.put(msg);
  }
  await tx.done;
}

export async function getLocalMessages(conversationId: string): Promise<ChatMessage[]> {
  const db = await getLocalDB();
  if (!db) return [];
  const messages = await db.getAllFromIndex("messages", "by-conversation", conversationId);
  // Sort chronologically ascending
  return messages.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export async function deleteLocalMessage(messageId: string): Promise<void> {
  const db = await getLocalDB();
  if (!db) return;
  await db.delete("messages", messageId);
}

/**
 * Permanently delete a conversation and all its messages and media blobs from local IndexedDB
 */
export async function deleteLocalConversation(conversationId: string): Promise<void> {
  const db = await getLocalDB();
  if (!db || !conversationId) return;

  const tx = db.transaction(["conversations", "messages", "media"], "readwrite");
  await tx.objectStore("conversations").delete(conversationId);

  // Delete all messages belonging to this conversation
  const msgKeys = await tx.objectStore("messages").index("by-conversation").getAllKeys(conversationId);
  for (const k of msgKeys) {
    await tx.objectStore("messages").delete(k);
  }

  // Delete all media records and revoke object URLs
  const mediaRecords = await tx.objectStore("media").index("by-conversation").getAll(conversationId);
  for (const m of mediaRecords) {
    if (blobUrlCache.has(m.mediaId)) {
      safeRevokeObjectURL(blobUrlCache.get(m.mediaId)!);
      blobUrlCache.delete(m.mediaId);
    }
    await tx.objectStore("media").delete(m.id);
  }

  await tx.done;
}

/**
 * Clear all messages and media blobs for a conversation while keeping the conversation shell
 */
export async function clearLocalConversationMessages(conversationId: string): Promise<void> {
  const db = await getLocalDB();
  if (!db || !conversationId) return;

  const tx = db.transaction(["messages", "media"], "readwrite");

  const msgKeys = await tx.objectStore("messages").index("by-conversation").getAllKeys(conversationId);
  for (const k of msgKeys) {
    await tx.objectStore("messages").delete(k);
  }

  const mediaRecords = await tx.objectStore("media").index("by-conversation").getAll(conversationId);
  for (const m of mediaRecords) {
    if (blobUrlCache.has(m.mediaId)) {
      safeRevokeObjectURL(blobUrlCache.get(m.mediaId)!);
      blobUrlCache.delete(m.mediaId);
    }
    await tx.objectStore("media").delete(m.id);
  }

  await tx.done;
}

export async function updateLocalMessageStatus(
  messageId: string,
  status: MessageDeliveryStatus
): Promise<void> {
  const db = await getLocalDB();
  if (!db) return;
  const existing = await db.get("messages", messageId);
  if (existing) {
    existing.delivery_status = status;
    await db.put("messages", existing);
  }
}

/* ─────────────────────────────────────────────────────────────
   3. MEDIA BINARY BLOBS STORAGE (Offline-First / Zero Backend)
   ───────────────────────────────────────────────────────────── */

export async function saveLocalMediaBlob(
  mediaId: string,
  conversationId: string,
  name: string,
  type: string,
  blob: Blob,
  size?: number
): Promise<string> {
  const db = await getLocalDB();
  const mediaSize = size || blob.size;

  if (db) {
    const record: StoredMediaRecord = {
      id: mediaId,
      mediaId,
      conversationId,
      name,
      type,
      blob,
      size: mediaSize,
      createdAt: new Date().toISOString(),
    };
    await db.put("media", record);
  }

  // Create & cache Object URL
  if (blobUrlCache.has(mediaId)) {
    safeRevokeObjectURL(blobUrlCache.get(mediaId)!);
  }
  const objUrl = safeCreateObjectURL(blob);
  blobUrlCache.set(mediaId, objUrl);
  return objUrl;
}

export async function getLocalMediaBlob(
  mediaId: string
): Promise<{ blob: Blob; url: string; record: StoredMediaRecord } | null> {
  const db = await getLocalDB();
  if (!db || !mediaId) return null;

  const record = await db.get("media", mediaId);
  if (!record || !record.blob) return null;

  let url = blobUrlCache.get(mediaId);
  if (!url) {
    url = safeCreateObjectURL(record.blob);
    blobUrlCache.set(mediaId, url);
  }

  return { blob: record.blob, url, record };
}

export async function getLocalMediaUrl(mediaId: string): Promise<string | null> {
  if (!mediaId) return null;
  if (blobUrlCache.has(mediaId)) {
    return blobUrlCache.get(mediaId)!;
  }
  const item = await getLocalMediaBlob(mediaId);
  return item?.url || null;
}

export async function hasLocalMedia(mediaId: string): Promise<boolean> {
  if (!mediaId) return false;
  if (blobUrlCache.has(mediaId)) return true;
  const db = await getLocalDB();
  if (!db) return false;
  const record = await db.get("media", mediaId);
  return Boolean(record?.blob);
}

export async function getAllLocalVaultMedia(): Promise<{
  media: VaultMediaItem[];
  docs: VaultMediaItem[];
  links: VaultLinkItem[];
}> {
  const db = await getLocalDB();
  if (!db) return { media: [], docs: [], links: [] };

  const records = await db.getAll("media");
  const allMessages = await db.getAll("messages");

  const media: VaultMediaItem[] = [];
  const docs: VaultMediaItem[] = [];

  for (const r of records) {
    let url = blobUrlCache.get(r.mediaId);
    if (!url && r.blob) {
      url = safeCreateObjectURL(r.blob);
      blobUrlCache.set(r.mediaId, url);
    }

    const isVideo =
      r.type.startsWith("video/") ||
      Boolean(r.name.match(/\.(mp4|webm|mov|mkv)$/i));

    const isImg =
      r.type.startsWith("image/") ||
      Boolean(r.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i));

    const item: VaultMediaItem = {
      id: r.id,
      conversation_id: r.conversationId,
      chat_title: "Device Vault",
      sender_id: "local-user",
      attachment_name: r.name,
      attachment_path: r.mediaId,
      attachment_size: r.size,
      created_at: r.createdAt,
      url: url || "",
      isVideo,
    };

    if (isImg || isVideo) {
      media.push(item);
    } else {
      docs.push(item);
    }
  }

  // Extract links from local messages
  const links: VaultLinkItem[] = [];
  const urlRegex = /(https?:\/\/[^\s<]+)/gi;

  for (const msg of allMessages) {
    if (!msg.content || !msg.content.includes("http")) continue;
    const matches = msg.content.match(urlRegex);
    if (!matches) continue;

    for (const rawUrl of matches) {
      try {
        const cleanUrl = rawUrl.replace(/[.,;!?)]+$/, "");
        const parsed = new URL(cleanUrl);
        links.push({
          id: `${msg.id}-${cleanUrl}`,
          conversation_id: msg.conversation_id,
          chat_title: msg.sender?.display_name || "Device Vault",
          url: cleanUrl,
          domain: parsed.hostname.replace(/^www\./, ""),
          created_at: msg.created_at,
          context_text: msg.content.replace(rawUrl, "").trim(),
        });
      } catch {}
    }
  }

  return { media, docs, links };
}

/**
 * Clear all local storage on logout / explicit reset
 */
export async function clearAllLocalData(): Promise<void> {
  // Revoke all cached object URLs
  blobUrlCache.forEach((url) => {
    safeRevokeObjectURL(url);
  });
  blobUrlCache.clear();

  const db = await getLocalDB();
  if (!db) return;

  const tx = db.transaction(["conversations", "messages", "media"], "readwrite");
  await tx.objectStore("conversations").clear();
  await tx.objectStore("messages").clear();
  await tx.objectStore("media").clear();
  await tx.done;
}

/**
 * Clear cached media files from IndexedDB (images, videos, documents)
 * while keeping conversations and message history intact.
 * Returns the total number of bytes freed.
 */
export async function clearLocalMediaCache(): Promise<number> {
  blobUrlCache.forEach((url) => {
    safeRevokeObjectURL(url);
  });
  blobUrlCache.clear();

  const db = await getLocalDB();
  if (!db) return 0;

  const records = await db.getAll("media");
  let freedBytes = 0;
  for (const r of records) {
    freedBytes += (r.size || (r.blob ? r.blob.size : 0) || 0);
  }

  const tx = db.transaction("media", "readwrite");
  await tx.objectStore("media").clear();
  await tx.done;

  return freedBytes;
}


export interface LocalMediaStorageBreakdown {
  photoBytes: number;
  videoBytes: number;
  fileBytes: number;
  totalMediaBytes: number;
  photoCount: number;
  videoCount: number;
  fileCount: number;
}

export async function getLocalMediaStorageBreakdown(): Promise<LocalMediaStorageBreakdown> {
  const db = await getLocalDB();
  if (!db) {
    return {
      photoBytes: 0,
      videoBytes: 0,
      fileBytes: 0,
      totalMediaBytes: 0,
      photoCount: 0,
      videoCount: 0,
      fileCount: 0,
    };
  }

  const records = await db.getAll("media");
  let photoBytes = 0;
  let videoBytes = 0;
  let fileBytes = 0;
  let photoCount = 0;
  let videoCount = 0;
  let fileCount = 0;

  for (const r of records) {
    const size = r.size || (r.blob ? r.blob.size : 0) || 0;
    const isVid =
      r.type.startsWith("video/") ||
      Boolean(r.name.match(/\.(mp4|webm|mov|mkv)$/i));
    const isImg =
      r.type.startsWith("image/") ||
      Boolean(r.name.match(/\.(jpeg|jpg|gif|png|webp|svg|heic)$/i));

    if (isImg) {
      photoBytes += size;
      photoCount++;
    } else if (isVid) {
      videoBytes += size;
      videoCount++;
    } else {
      fileBytes += size;
      fileCount++;
    }
  }

  return {
    photoBytes,
    videoBytes,
    fileBytes,
    totalMediaBytes: photoBytes + videoBytes + fileBytes,
    photoCount,
    videoCount,
    fileCount,
  };
}
