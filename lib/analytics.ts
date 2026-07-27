"use client";

interface EventPayload {
  eventName: string;
  properties?: Record<string, unknown>;
}

/**
 * Lightweight client-side monitoring & analytics logger.
 * Sends events in production without slowing down the user thread.
 */
export function trackEvent({ eventName, properties }: EventPayload) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Analytics Track] ${eventName}:`, properties || {});
    return;
  }

  try {
    if (typeof window !== "undefined" && "gtag" in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag("event", eventName, properties);
    }
  } catch (err) {
    console.error("Analytics dispatch error:", err);
  }
}
