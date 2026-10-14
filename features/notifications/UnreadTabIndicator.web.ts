"use client";

import { useEffect, useRef } from "react";
import { setFaviconBadgeCount } from "@/hooks/use-dynamic-favicon";
import { isDesktopWeb } from "@/lib/platform/Platform.utils";

/**
 * Browser-specific unread tab notification logic.
 * Updates document.title and favicon badge dynamically.
 */
export function useUnreadTabIndicatorWeb(
  totalUnread: number,
  onReconcile?: () => void
): void {
  const onReconcileRef = useRef(onReconcile);

  useEffect(() => {
    onReconcileRef.current = onReconcile;
  }, [onReconcile]);

  useEffect(() => {
    if (!isDesktopWeb()) return;

    if (totalUnread > 0) {
      document.title = `(${totalUnread}) AetherChat`;
      setFaviconBadgeCount(totalUnread);
    } else {
      document.title = "AetherChat";
      setFaviconBadgeCount(0);
    }
  }, [totalUnread]);

  // Reconcile with authoritative data when the tab becomes active/visible
  useEffect(() => {
    if (!isDesktopWeb()) return;

    function handleVisibilityOrFocus() {
      if (document.visibilityState === "visible") {
        onReconcileRef.current?.();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isDesktopWeb()) {
        document.title = "AetherChat";
        setFaviconBadgeCount(0);
      }
    };
  }, []);
}
