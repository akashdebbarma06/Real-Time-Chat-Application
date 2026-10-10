"use client";

import { useEffect, useState } from "react";

const PINNED_MESSAGES_EVENT = "aether_pinned_messages_updated";

function getLocalKey(conversationId: string) {
  return `aether_pinned_msgs_${conversationId}`;
}

export function getLocalPinnedMessageIds(conversationId: string): Set<string> {
  if (typeof window === "undefined" || !conversationId) return new Set();
  try {
    const raw = localStorage.getItem(getLocalKey(conversationId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function setLocalPinnedMessageIds(conversationId: string, ids: Set<string>) {
  if (typeof window === "undefined" || !conversationId) return;
  try {
    localStorage.setItem(getLocalKey(conversationId), JSON.stringify([...ids]));
    window.dispatchEvent(
      new CustomEvent(PINNED_MESSAGES_EVENT, { detail: { conversationId } })
    );
  } catch {
    // Ignore storage errors
  }
}

export function toggleMessagePin(
  conversationId: string,
  messageId: string
): { isPinned: boolean } {
  if (!conversationId || !messageId) return { isPinned: false };

  const current = getLocalPinnedMessageIds(conversationId);
  const wasPinned = current.has(messageId);
  const nextPinned = !wasPinned;

  const next = new Set(current);
  if (nextPinned) {
    next.add(messageId);
  } else {
    next.delete(messageId);
  }

  setLocalPinnedMessageIds(conversationId, next);
  return { isPinned: nextPinned };
}

export function usePinnedMessageIds(conversationId: string): Set<string> {
  const [prevConvId, setPrevConvId] = useState(conversationId);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() =>
    getLocalPinnedMessageIds(conversationId)
  );

  if (prevConvId !== conversationId) {
    setPrevConvId(conversationId);
    setPinnedIds(getLocalPinnedMessageIds(conversationId));
  }

  useEffect(() => {
    if (!conversationId) return;

    function handleUpdate(event: Event) {
      const custom = event as CustomEvent<{ conversationId?: string }>;
      if (!custom.detail?.conversationId || custom.detail.conversationId === conversationId) {
        setPinnedIds(getLocalPinnedMessageIds(conversationId));
      }
    }

    window.addEventListener(PINNED_MESSAGES_EVENT, handleUpdate);
    return () => window.removeEventListener(PINNED_MESSAGES_EVENT, handleUpdate);
  }, [conversationId]);

  return pinnedIds;
}
