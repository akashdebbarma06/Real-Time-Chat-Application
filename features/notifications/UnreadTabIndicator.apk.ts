"use client";

/**
 * Android APK specific implementation of unread tab indicator.
 * In a native WebView environment, browser tab titles and favicon badges are non-existent,
 * so this implementation safely no-ops while preserving interface compatibility.
 */
export function useUnreadTabIndicatorApk(): void {
  // Safe no-op on native Android APK
}
