import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { Capacitor } from "@capacitor/core";
import {
  generateFaviconSvgUrl,
  setFaviconBadgeCount,
  getFaviconBadgeCount,
  updateFavicon,
} from "@/hooks/use-dynamic-favicon";
import {
  isDesktopWeb,
  useWebUnreadTabIndicator,
} from "@/hooks/use-web-unread-tab-indicator";

describe("Web Only: Unread Browser Tab Indicator Suite", () => {
  beforeEach(() => {
    document.title = "AetherChat";
    setFaviconBadgeCount(0);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    document.title = "AetherChat";
    setFaviconBadgeCount(0);
  });

  describe("Favicon SVG Badge Rendering", () => {
    it("renders clean AetherChat branding without badge when unreadCount is 0", () => {
      const svgUrl = generateFaviconSvgUrl({
        fillColor: "#00A884",
        badgeCount: 0,
      });
      const decoded = decodeURIComponent(svgUrl);
      expect(decoded).toContain('<rect width="128" height="128" rx="36" fill="#00A884"');
      expect(decoded).toContain('fill="#FFFFFF"');
      expect(decoded).toContain('<circle cx="51" cy="51" r="5" fill="#00A884"');
      expect(decoded).not.toContain('fill="#EF4444"');
    });

    it("renders notification badge circle in top-right corner when unreadCount > 0", () => {
      const svgUrl = generateFaviconSvgUrl({
        fillColor: "#00A884",
        badgeCount: 1,
      });
      const decoded = decodeURIComponent(svgUrl);
      expect(decoded).toContain('<rect width="128" height="128" rx="36" fill="#00A884"');
      // Red badge circle with white outline border
      expect(decoded).toContain('<circle cx="102" cy="26" r="18" fill="#EF4444" stroke="#FFFFFF" stroke-width="4"/>');
    });

    it("manages current badge count and updates favicon link tags", () => {
      setFaviconBadgeCount(5);
      expect(getFaviconBadgeCount()).toBe(5);

      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      expect(link).not.toBeNull();
      const decodedHref = decodeURIComponent(link?.href || "");
      expect(decodedHref).toContain('fill="#EF4444"');

      setFaviconBadgeCount(0);
      expect(getFaviconBadgeCount()).toBe(0);
      const clearedHref = decodeURIComponent(link?.href || "");
      expect(clearedHref).not.toContain('fill="#EF4444"');
    });
  });

  describe("Platform Scope & Protection", () => {
    it("detects desktop web when Capacitor is on web and not native", () => {
      vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(false);
      vi.spyOn(Capacitor, "getPlatform").mockReturnValue("web");

      expect(isDesktopWeb()).toBe(true);
    });

    it("returns false for Android APK or native platform runtimes", () => {
      vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
      vi.spyOn(Capacitor, "getPlatform").mockReturnValue("android");

      expect(isDesktopWeb()).toBe(false);
    });
  });

  describe("useWebUnreadTabIndicator Hook Real-Time Behavior", () => {
    it("updates document.title and favicon badge when unread messages arrive on web", () => {
      vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(false);
      vi.spyOn(Capacitor, "getPlatform").mockReturnValue("web");

      const { rerender } = renderHook(
        ({ count }) => useWebUnreadTabIndicator(count),
        { initialProps: { count: 0 } }
      );

      // 0 unread: clean title and badge 0
      expect(document.title).toBe("AetherChat");
      expect(getFaviconBadgeCount()).toBe(0);

      // 1 unread message
      rerender({ count: 1 });
      expect(document.title).toBe("(1) AetherChat");
      expect(getFaviconBadgeCount()).toBe(1);

      // Multiple unread messages (5)
      rerender({ count: 5 });
      expect(document.title).toBe("(5) AetherChat");
      expect(getFaviconBadgeCount()).toBe(5);

      // Reading messages: count decreases to 2
      rerender({ count: 2 });
      expect(document.title).toBe("(2) AetherChat");
      expect(getFaviconBadgeCount()).toBe(2);

      // All read: count drops to 0
      rerender({ count: 0 });
      expect(document.title).toBe("AetherChat");
      expect(getFaviconBadgeCount()).toBe(0);
    });

    it("does not alter title or favicon when running in Android APK native platform", () => {
      vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
      vi.spyOn(Capacitor, "getPlatform").mockReturnValue("android");

      document.title = "AetherChat Native";
      setFaviconBadgeCount(0);

      const { rerender } = renderHook(
        ({ count }) => useWebUnreadTabIndicator(count),
        { initialProps: { count: 0 } }
      );

      rerender({ count: 4 });
      // Title and favicon should remain completely untouched on native platform
      expect(document.title).toBe("AetherChat Native");
      expect(getFaviconBadgeCount()).toBe(0);
    });

    it("cleans up tab title and favicon badge when unmounting (e.g. logout or navigation away)", () => {
      vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(false);
      vi.spyOn(Capacitor, "getPlatform").mockReturnValue("web");

      const { unmount } = renderHook(
        ({ count }) => useWebUnreadTabIndicator(count),
        { initialProps: { count: 3 } }
      );

      expect(document.title).toBe("(3) AetherChat");
      expect(getFaviconBadgeCount()).toBe(3);

      unmount();

      expect(document.title).toBe("AetherChat");
      expect(getFaviconBadgeCount()).toBe(0);
    });

    it("triggers reconcile callback when the browser tab becomes visible", () => {
      vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(false);
      vi.spyOn(Capacitor, "getPlatform").mockReturnValue("web");

      const onReconcile = vi.fn();
      renderHook(() => useWebUnreadTabIndicator(2, onReconcile));

      // Simulate visibility change to visible
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        configurable: true,
      });

      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(onReconcile).toHaveBeenCalledTimes(1);

      // Simulate window focus event
      act(() => {
        window.dispatchEvent(new Event("focus"));
      });

      expect(onReconcile).toHaveBeenCalledTimes(2);
    });
  });
});
