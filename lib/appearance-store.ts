"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

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

import { updateFavicon } from "@/hooks/use-dynamic-favicon";

export const ACCENT_COLORS: {
  id: AccentColor;
  label: string;
  hex: string;
  hoverHex: string;
  subtleHex: string;
  gradient: string;
  description: string;
}[] = [
  { id: "emerald", label: "Emerald", hex: "#00a884", hoverHex: "#008f70", subtleHex: "rgba(0, 168, 132, 0.15)", gradient: "from-emerald-500 to-teal-600", description: "Cybernetic mint & emerald" },
  { id: "blue", label: "Ocean", hex: "#007bfc", hoverHex: "#0068d6", subtleHex: "rgba(0, 123, 252, 0.15)", gradient: "from-blue-500 to-cyan-600", description: "Vibrant ocean blue" },
  { id: "cyan", label: "Teal", hex: "#06b6d4", hoverHex: "#0891b2", subtleHex: "rgba(6, 182, 212, 0.15)", gradient: "from-cyan-500 to-teal-500", description: "Modern luminous teal" },
  { id: "purple", label: "Violet", hex: "#7c3aed", hoverHex: "#6d28d9", subtleHex: "rgba(124, 58, 237, 0.15)", gradient: "from-purple-500 to-indigo-600", description: "Signature cosmic violet" },
  { id: "rose", label: "Rose", hex: "#f43f5e", hoverHex: "#e11d48", subtleHex: "rgba(244, 63, 94, 0.15)", gradient: "from-rose-500 to-pink-600", description: "Warm glowing crimson & rose" },
  { id: "amber", label: "Amber", hex: "#f59e0b", hoverHex: "#d97706", subtleHex: "rgba(245, 158, 11, 0.15)", gradient: "from-amber-500 to-orange-600", description: "Warm radiant golden amber" },
];

export const APP_ICONS: {
  id: AppIconChoice;
  label: string;
  gradient: string;
  description: string;
  stops: [string, string, string];
  dotColor: string;
  primaryHex: string;
  accentId?: AccentColor;
}[] = [
  {
    id: "classic",
    label: "Classic Aether",
    gradient: "from-purple-600 via-indigo-600 to-cyan-500",
    description: "Signature cosmic gradient",
    stops: ["#7c3aed", "#4f46e5", "#06b6d4"],
    dotColor: "#7c3aed",
    primaryHex: "#7c3aed",
    accentId: "purple",
  },
  {
    id: "neon",
    label: "Neon Pulse",
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
    description: "High-voltage electric blue",
    stops: ["#06b6d4", "#007bfc", "#4f46e5"],
    dotColor: "#007bfc",
    primaryHex: "#007bfc",
    accentId: "blue",
  },
  {
    id: "emerald",
    label: "Emerald Aura",
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    description: "Luminous digital emerald",
    stops: ["#00a884", "#0d9488", "#06b6d4"],
    dotColor: "#00a884",
    primaryHex: "#00a884",
    accentId: "emerald",
  },
  {
    id: "sunset",
    label: "Sunset Glow",
    gradient: "from-rose-500 via-orange-500 to-amber-500",
    description: "Warm golden twilight",
    stops: ["#f43f5e", "#ea580c", "#f59e0b"],
    dotColor: "#f43f5e",
    primaryHex: "#f43f5e",
    accentId: "rose",
  },
  {
    id: "midnight",
    label: "Midnight Stealth",
    gradient: "from-zinc-700 via-slate-800 to-zinc-950",
    description: "Sleek obsidian monochrome",
    stops: ["#52525b", "#27272a", "#09090b"],
    dotColor: "#3f3f46",
    primaryHex: "#27272a",
    accentId: "purple",
  },
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
  { id: "rounded", label: "Default", description: "Balanced curved corners with soft subtle tail", ownClass: "rounded-2xl rounded-br-sm", peerClass: "rounded-2xl rounded-bl-sm" },
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
  const accent = ACCENT_COLORS.find((c) => c.id === prefs.accentColor) || ACCENT_COLORS[0];
  const appIcon = APP_ICONS.find((i) => i.id === prefs.appIcon) || APP_ICONS[0];

  root.setAttribute("data-accent", prefs.accentColor);
  root.setAttribute("data-app-icon", prefs.appIcon);
  root.setAttribute("data-bubble-style", prefs.bubbleStyle);
  root.setAttribute("data-chat-bg", prefs.chatBackground);
  root.setAttribute("data-font-size", prefs.fontSize);
  root.setAttribute("data-chat-view", prefs.chatViewMode || "single");

  // Synchronize CSS variables across the app for accent and primary elements
  root.style.setProperty("--color-accent", accent.hex);
  root.style.setProperty("--color-accent-hover", accent.hoverHex);
  root.style.setProperty("--color-accent-subtle", accent.subtleHex);
  root.style.setProperty("--primary", accent.hex);
  root.style.setProperty("--ring", accent.hex);

  // Synchronize dynamic favicon with active App Icon
  updateFavicon({
    stops: appIcon.stops,
    dotColor: appIcon.dotColor,
  });

  // Synchronize native mobile app launcher icon if running in Capacitor
  syncNativeAppIcon(prefs.appIcon);
}

export function syncNativeAppIcon(iconId: AppIconChoice) {
  if (typeof window === "undefined") return;
  const cap = (
    window as unknown as {
      Capacitor?: {
        Plugins?: {
          AppIcon?: { setAppIcon: (opts: { name: string }) => Promise<void> };
        };
      };
    }
  ).Capacitor;
  if (cap?.Plugins?.AppIcon) {
    void cap.Plugins.AppIcon.setAppIcon({ name: iconId }).catch(() => {
      // Ignored in non-native browser environment
    });
  }
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

const emptySubscribe = () => () => {};

export function useAppearance() {
  const [preferences, setPreferences] = useState<AppearancePreferences>(() =>
    typeof window !== "undefined" ? getStoredAppearance() : DEFAULT_APPEARANCE
  );
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    applyAppearanceToDOM(preferences);
  }, [preferences]);

  useEffect(() => {
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
