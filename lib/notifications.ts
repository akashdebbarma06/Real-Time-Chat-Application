"use client";

import { toast } from "sonner";

/**
 * Play a pleasant Web Audio API chime notification sound.
 * Works on any browser & mobile device without needing external audio asset files.
 */
export function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Pleasant double chime: 587Hz (D5) -> 880Hz (A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch (err) {
    console.warn("Could not play notification sound:", err);
  }
}

/**
 * Request browser push notification permissions.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Show a browser push notification and in-app toast for incoming messages.
 */
export function notifyIncomingMessage({
  senderName,
  content,
  avatarUrl,
  muted = false,
}: {
  senderName: string;
  content: string;
  avatarUrl?: string;
  muted?: boolean;
}) {
  if (muted) return;

  // 1. Play sound
  playNotificationSound();

  // 2. In-App Toast
  toast(`New message from ${senderName}`, {
    description: content || "Sent an attachment",
    icon: "💬",
  });

  // 3. Browser Desktop / Mobile Push Notification
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(`Message from ${senderName}`, {
        body: content || "Sent an attachment",
        icon: avatarUrl || "/favicon.ico",
        badge: "/favicon.ico",
        tag: `msg-${Date.now()}`,
      });
    } catch (err) {
      console.warn("Failed to dispatch browser notification:", err);
    }
  }
}
