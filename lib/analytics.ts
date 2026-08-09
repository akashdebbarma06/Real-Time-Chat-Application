"use client";

interface EventPayload {
  eventName: string;
  properties?: Record<string, unknown>;
}

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, eventParams?: Record<string, unknown>) => void;
  }
}

export function trackEvent({ eventName, properties }: EventPayload) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Analytics Track] ${eventName}:`, properties || {});
    return;
  }

  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", eventName, properties);
    }
  } catch (err) {
    console.error("Analytics dispatch error:", err);
  }
}
