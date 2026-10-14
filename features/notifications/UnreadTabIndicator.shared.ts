"use client";

import { isDesktopWeb } from "@/lib/platform/Platform.utils";
import { useUnreadTabIndicatorWeb } from "./UnreadTabIndicator.web";
import { useUnreadTabIndicatorApk } from "./UnreadTabIndicator.apk";
import type { UseUnreadTabIndicator } from "./UnreadTabIndicator.types";

/**
 * Shared platform adapter for unread tab indicator.
 * Dispatches to web implementation on desktop web and APK implementation on native Android.
 */
export const useUnreadTabIndicator: UseUnreadTabIndicator = (
  totalUnread: number,
  onReconcile?: () => void
): void => {
  const isWeb = isDesktopWeb();

  // Next.js client component hook dispatch
  useUnreadTabIndicatorWeb(isWeb ? totalUnread : 0, isWeb ? onReconcile : undefined);
  useUnreadTabIndicatorApk();
};

// Backward-compatible alias
export const useWebUnreadTabIndicator = useUnreadTabIndicator;
export * from "./UnreadTabIndicator.types";
