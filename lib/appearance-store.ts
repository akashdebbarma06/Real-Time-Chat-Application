"use client";

import { useEffect, useState } from "react";

export type AccentColor = "purple" | "blue" | "emerald" | "rose" | "amber" | "cyan";
export type AppIconChoice = "classic" | "neon" | "emerald" | "sunset" | "midnight";
export type ChatBackground = "default" | "dots" | "grid" | "stars" | "mesh";
export type BubbleStyle = "rounded" | "classic" | "minimal" | "pill";
export type FontSizeChoice = "normal" | "compact" | "large";
export type ChatViewMode = "single" | "multi";

export interface AppearancePreferences {
  accentColor: AccentColor;
  appIcon: AppIconChoice;
  chatBackground: ChatBackground;
  bubbleStyle: BubbleStyle;
  fontSize: FontSizeChoice;
  chatViewMode?: ChatViewMode;
}

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  accentColor: "purple",
  appIcon: "classic",
  chatBackground: "default",
  bubbleStyle: "rounded",
  fontSize: "normal",
  chatViewMode: "single",
};

const STORAGE_KEY = "aether_appearance_preferences";
const APPEARANCE_EVENT = "aether_appearance_updated";

export const ACCENT_COLORS: {
  id: AccentColor;
  label: string;
  hex: string;
  gradient: string;
  description: string;
}[] = [
  { id: "emerald", label: "Emerald", hex: "#10b981", gradient: "from-emerald-500 to-teal-600", description: "Cybernetic mint & emerald" },
  { id: "blue", label: "Ocean", hex: "#3b82f6", gradient: "from-blue-500 to-cyan-600", description: "Vibrant ocean blue" },
  { id: "cyan", label: "Teal", hex: "#06b6d4", gradient: "from-cyan-500 to-teal-500", description: "Modern luminous teal" },
  { id: "purple", label: "Violet", hex: "#8b5cf6", gradient: "from-purple-500 to-indigo-600", description: "Signature cosmic violet" },
  { id: "rose", label: "Rose", hex: "#f43f5e", gradient: "from-rose-500 to-pink-600", description: "Warm glowing crimson & rose" },
  { id: "amber", label: "Amber", hex: "#f59e0b", gradient: "from-amber-500 to-orange-600", description: "Warm radiant golden amber" },
];

export const APP_ICONS: {
  id: AppIconChoice;
  label: string;
  gradient: string;
  description: string;
}[] = [
  { id: "classic", label: "Classic Aether", gradient: "from-purple-600 via-indigo-600 to-cyan-500", description: "Signature cosmic gradient" },
  { id: "neon", label: "Neon Pulse", gradient: "from-cyan-400 via-blue-500 to-indigo-600", description: "High-voltage electric blue" },
  { id: "emerald", label: "Emerald Aura", gradient: "from-emerald-400 via-teal-500 to-cyan-600", description: "Luminous digital emerald" },
  { id: "sunset", label: "Sunset Glow", gradient: "from-rose-500 via-orange-500 to-amber-500", description: "Warm golden twilight" },
  { id: "midnight", label: "Midnight Stealth", gradient: "from-zinc-700 via-slate-800 to-zinc-950", description: "Sleek obsidian monochrome" },
];

export const CHAT_BACKGROUNDS: {
  id: ChatBackground;
  label: string;
  description: string;
  className: string;
}[] = [
  { id: "default", label: "Clean Minimal", description: "Pure flat surface, zero distractions", className: "chat-bg-default" },
  { id: "dots", label: "Subtle Dots", description: "Refined micro-dot grid pattern", className: "chat-bg-dots" },
  { id: "grid", label: "Tech Grid", description: "Modern blueprint grid matrix", className: "chat-bg-grid" },
  { id: "stars", label: "Constellation", description: "Subtle stardust stellar texture", className: "chat-bg-stars" },
  { id: "mesh", label: "Soft Glow", description: "Gentle ambient colorful light blobs", className: "chat-bg-mesh" },
];

export const BUBBLE_STYLES: {
  id: BubbleStyle;
  label: string;
  description: string;
  ownClass: string;
  peerClass: string;
}[] = [
  { id: "rounded", label: "Default", description: "Balanced curved corners with soft subtle tail", ownClass: "rounded-2xl rounded-br-xs", peerClass: "rounded-2xl rounded-bl-xs" },
  { id: "classic", label: "Classic", description: "Traditional chat bubble with sharp corner", ownClass: "rounded-2xl rounded-br-none", peerClass: "rounded-2xl rounded-bl-none" },
  { id: "pill", label: "Pill", description: "Soft elongated pill curvature", ownClass: "rounded-full px-4 py-2", peerClass: "rounded-full px-4 py-2" },
  { id: "minimal", label: "Minimal", description: "Subtle 8px rounded corners", ownClass: "rounded-lg rounded-br-none", peerClass: "rounded-lg rounded-bl-none" },
];

export function getStoredAppearance(): AppearancePreferences {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw);
    return {
      accentColor: parsed.accentColor || DEFAULT_APPEARANCE.accentColor,
      appIcon: parsed.appIcon || DEFAULT_APPEARANCE.appIcon,
      chatBackground: parsed.chatBackground || DEFAULT_APPEARANCE.chatBackground,
      bubbleStyle: parsed.bubbleStyle || DEFAULT_APPEARANCE.bubbleStyle,
      fontSize: parsed.fontSize || DEFAULT_APPEARANCE.fontSize,
      chatViewMode: parsed.chatViewMode || DEFAULT_APPEARANCE.chatViewMode,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function applyAppearanceToDOM(prefs: AppearancePreferences) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-accent", prefs.accentColor);
  root.setAttribute("data-bubble-style", prefs.bubbleStyle);
  root.setAttribute("data-chat-bg", prefs.chatBackground);
  root.setAttribute("data-font-size", prefs.fontSize);
  root.setAttribute("data-chat-view", prefs.chatViewMode || "single");
}

export function saveAppearancePreferences(prefs: AppearancePreferences) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    applyAppearanceToDOM(prefs);
    window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT, { detail: prefs }));
  } catch {
    // Storage fallback
  }
}

export function updateAppearancePreferences(partial: Partial<AppearancePreferences>): AppearancePreferences {
  const current = getStoredAppearance();
  const next: AppearancePreferences = { ...current, ...partial };
  saveAppearancePreferences(next);
  return next;
}

export function resetAppearancePreferences(): AppearancePreferences {
  saveAppearancePreferences(DEFAULT_APPEARANCE);
  return DEFAULT_APPEARANCE;
}

export function useAppearance() {
  const [preferences, setPreferences] = useState<AppearancePreferences>(DEFAULT_APPEARANCE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getStoredAppearance();
    setPreferences(initial);
    applyAppearanceToDOM(initial);
    setMounted(true);

    function handleUpdate(e: Event) {
      const customEvent = e as CustomEvent<AppearancePreferences>;
      if (customEvent.detail) {
        setPreferences(customEvent.detail);
      } else {
        setPreferences(getStoredAppearance());
      }
    }

    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        const next = getStoredAppearance();
        setPreferences(next);
        applyAppearanceToDOM(next);
      }
    }

    window.addEventListener(APPEARANCE_EVENT, handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(APPEARANCE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return {
    preferences,
    mounted,
    setAccentColor: (accentColor: AccentColor) => updateAppearancePreferences({ accentColor }),
    setAppIcon: (appIcon: AppIconChoice) => updateAppearancePreferences({ appIcon }),
    setChatBackground: (chatBackground: ChatBackground) => updateAppearancePreferences({ chatBackground }),
    setBubbleStyle: (bubbleStyle: BubbleStyle) => updateAppearancePreferences({ bubbleStyle }),
    setFontSize: (fontSize: FontSizeChoice) => updateAppearancePreferences({ fontSize }),
    setChatViewMode: (chatViewMode: ChatViewMode) => updateAppearancePreferences({ chatViewMode }),
    updatePreferences: updateAppearancePreferences,
    resetPreferences: resetAppearancePreferences,
  };
}
