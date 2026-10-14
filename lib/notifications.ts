"use client";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
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
 * Request notification permissions (native Android POST_NOTIFICATIONS or browser Push).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const cap = (
    window as unknown as {
      Capacitor?: {
        Plugins?: {
          NativeNotifications?: {
            requestPermission: () => Promise<{ granted: boolean }>;
            checkPermission: () => Promise<{ granted: boolean }>;
          };
        };
      };
    }
  )?.Capacitor;

  if (cap?.Plugins?.NativeNotifications) {
    try {
      const res = await cap.Plugins.NativeNotifications.requestPermission();
      return Boolean(res?.granted);
    } catch {
      return false;
    }
  }

  if (!("Notification" in window)) {
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

export interface IncomingNotificationOptions {
  senderName: string;
  content: string;
  conversationId?: string;
  avatarUrl?: string;
  muted?: boolean;
}

/**
 * Show a native or browser notification for incoming messages.
 * In-app toast notifications for chat messages are disabled per user request.
 */
export function notifyIncomingMessage({
  senderName,
  content,
  conversationId,
  avatarUrl,
  muted = false,
}: IncomingNotificationOptions) {
  if (muted) return;

  // 1. Play sound chime
  playNotificationSound();

  // 2. Native Android Push / Local Notification via Capacitor Plugin
  if (typeof window !== "undefined") {
    const cap = (
      window as unknown as {
        Capacitor?: {
          Plugins?: {
            NativeNotifications?: {
              showNotification: (opts: {
                title: string;
                body: string;
                conversationId?: string;
                id?: number;
              }) => Promise<void>;
            };
          };
        };
      }
    )?.Capacitor;

    if (cap?.Plugins?.NativeNotifications) {
      void cap.Plugins.NativeNotifications.showNotification({
        title: senderName,
        body: content || "Sent an attachment",
        conversationId,
      }).catch((err) => {
        console.warn("Failed to dispatch native Android notification:", err);
      });
      return;
    }
  }

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

