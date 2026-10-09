import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  DEFAULT_APPEARANCE,
  getStoredAppearance,
  updateAppearancePreferences,
  resetAppearancePreferences,
  applyAppearanceToDOM,
  ACCENT_COLORS,
  APP_ICONS,
  BUBBLE_STYLES,
  CHAT_BACKGROUNDS,
} from "@/lib/appearance-store";

describe("Appearance Store and Personalization", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-accent");
    document.documentElement.removeAttribute("data-bubble-style");
    document.documentElement.removeAttribute("data-chat-bg");
    document.documentElement.removeAttribute("data-font-size");
  });

  it("returns default appearance preferences when storage is empty", () => {
    const prefs = getStoredAppearance();
    expect(prefs).toEqual(DEFAULT_APPEARANCE);
    expect(prefs.accentColor).toBe("purple");
    expect(prefs.appIcon).toBe("classic");
    expect(prefs.chatBackground).toBe("default");
    expect(prefs.bubbleStyle).toBe("rounded");
  });

  it("persists accent color updates and dispatches custom event", () => {
    const listener = vi.fn();
    window.addEventListener("aether_appearance_updated", listener);

    const updated = updateAppearancePreferences({ accentColor: "emerald" });
    expect(updated.accentColor).toBe("emerald");

    const retrieved = getStoredAppearance();
    expect(retrieved.accentColor).toBe("emerald");
    expect(listener).toHaveBeenCalled();

    window.removeEventListener("aether_appearance_updated", listener);
  });

  it("persists chat background wallpaper preference", () => {
    updateAppearancePreferences({ chatBackground: "stars" });
    const retrieved = getStoredAppearance();
    expect(retrieved.chatBackground).toBe("stars");
  });

  it("persists message bubble style preference", () => {
    updateAppearancePreferences({ bubbleStyle: "pill" });
    const retrieved = getStoredAppearance();
    expect(retrieved.bubbleStyle).toBe("pill");
  });

  it("persists app icon choice preference", () => {
    updateAppearancePreferences({ appIcon: "neon" });
    const retrieved = getStoredAppearance();
    expect(retrieved.appIcon).toBe("neon");
  });

  it("correctly applies appearance attributes to DOM documentElement", () => {
    applyAppearanceToDOM({
      accentColor: "rose",
      bubbleStyle: "classic",
      chatBackground: "grid",
      appIcon: "sunset",
      fontSize: "normal",
    });

    expect(document.documentElement.getAttribute("data-accent")).toBe("rose");
    expect(document.documentElement.getAttribute("data-bubble-style")).toBe("classic");
    expect(document.documentElement.getAttribute("data-chat-bg")).toBe("grid");
  });

  it("resets preferences to default values", () => {
    updateAppearancePreferences({
      accentColor: "amber",
      bubbleStyle: "minimal",
      chatBackground: "mesh",
      appIcon: "midnight",
    });

    const reset = resetAppearancePreferences();
    expect(reset).toEqual(DEFAULT_APPEARANCE);

    const retrieved = getStoredAppearance();
    expect(retrieved.accentColor).toBe("purple");
  });

  it("provides valid configurations for accents, backgrounds, bubbles, and app icons", () => {
    expect(ACCENT_COLORS.length).toBeGreaterThanOrEqual(5);
    expect(APP_ICONS.length).toBeGreaterThanOrEqual(4);
    expect(BUBBLE_STYLES.length).toBeGreaterThanOrEqual(4);
    expect(CHAT_BACKGROUNDS.length).toBeGreaterThanOrEqual(4);

    expect(ACCENT_COLORS.some((c) => c.id === "purple")).toBe(true);
    expect(BUBBLE_STYLES.some((b) => b.id === "rounded")).toBe(true);
    expect(CHAT_BACKGROUNDS.some((g) => g.id === "default")).toBe(true);
  });
});
