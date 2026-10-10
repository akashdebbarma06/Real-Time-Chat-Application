"use client";

import { useTheme } from "next-themes";
import {
  ArrowLeft,
  Check,
  Columns2,
  Laptop,
  Moon,
  RotateCcw,
  Square,
  Sun,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ACCENT_COLORS,
  APP_ICONS,
  BUBBLE_STYLES,
  useAppearance,
  type AccentColor,
  type AppIconChoice,
  type BubbleStyle,
  type ChatViewMode,
} from "@/lib/appearance-store";
import { cn } from "@/lib/utils";

interface AppearancePanelProps {
  onBack: () => void;
}

export function AppearancePanel({ onBack }: AppearancePanelProps) {
  const { theme, setTheme } = useTheme();
  const {
    preferences,
    setAccentColor,
    setAppIcon,
    setChatBackground,
    setBubbleStyle,
    setChatViewMode,
    resetPreferences,
  } = useAppearance();

  const activeAccent = ACCENT_COLORS.find((c) => c.id === preferences.accentColor) || ACCENT_COLORS[0];
  const activeBubble = BUBBLE_STYLES.find((b) => b.id === preferences.bubbleStyle) || BUBBLE_STYLES[0];
  const isWallpaperEnabled = preferences.chatBackground !== "default";

  function handleReset() {
    resetPreferences();
    setTheme("system");
    toast.success("Appearance reset to defaults");
  }

  const themes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Laptop },
  ];

  const bubbleOptions: { id: BubbleStyle; label: string }[] = [
    { id: "rounded", label: "Default" },
    { id: "classic", label: "Classic" },
    { id: "pill", label: "Pill" },
  ];

  return (
    <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            className="rounded-xl size-8 shrink-0 hover:bg-muted"
            aria-label="Back to settings"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Appearance</h3>
            <p className="text-[11px] text-muted-foreground truncate">Theme, accents & wallpaper</p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 px-2.5 gap-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
          title="Reset to defaults"
        >
          <RotateCcw className="size-3" />
          <span>Reset</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-5 pb-28 md:pb-6">
        {/* 1. Live Preview - Top-mounted minimal message card */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Preview
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {activeAccent.label} · {activeBubble.label}
            </span>
          </div>

          <div
            className={cn(
              "relative rounded-xl border border-border/70 p-4 overflow-hidden transition-all duration-300 bg-card/40 shadow-xs",
              isWallpaperEnabled ? "chat-bg-dots" : "chat-bg-default"
            )}
          >
            <div className="relative space-y-2.5">
              {/* Peer message */}
              <div className="flex items-end gap-2 max-w-[85%]">
                <div
                  className={cn(
                    "px-3.5 py-2 text-xs bg-muted text-foreground transition-all duration-200 shadow-xs",
                    activeBubble.peerClass
                  )}
                >
                  <p className="leading-snug">Hey! How does the new theme look? ✨</p>
                  <span className="mt-1 block text-[9px] text-muted-foreground text-right">10:42 AM</span>
                </div>
              </div>

              {/* Own message with active accent */}
              <div className="flex items-end justify-end">
                <div
                  className={cn(
                    "px-3.5 py-2 max-w-[85%] text-xs bg-primary text-primary-foreground transition-all duration-200 shadow-xs",
                    activeBubble.ownClass
                  )}
                >
                  <p className="leading-snug font-medium">Clean, minimal, and perfectly balanced! 🚀</p>
                  <span className="mt-1 block text-[9px] text-primary-foreground/80 text-right">10:43 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Grouped List Card: Theme & Accent Color */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
            Display
          </p>
          <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
            {/* Theme Mode Segmented Control */}
            <div className="p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Theme Mode</span>
                <span className="text-[11px] text-muted-foreground capitalize">{theme}</span>
              </div>
              <div className="grid grid-cols-3 p-1 rounded-xl bg-muted/60 border border-border/40 gap-1">
                {themes.map((item) => {
                  const Icon = item.icon;
                  const isSelected = theme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTheme(item.id);
                        toast.success(`Theme set to ${item.label}`);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer",
                        isSelected
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      <Icon className="size-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Color Swatches */}
            <div className="p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Accent Color</span>
                <span className="text-[11px] text-primary font-semibold">{activeAccent.label}</span>
              </div>
              <div className="flex items-center justify-between pt-0.5 px-1">
                {ACCENT_COLORS.map((accent) => {
                  const isSelected = preferences.accentColor === accent.id;
                  return (
                    <button
                      key={accent.id}
                      type="button"
                      onClick={() => {
                        setAccentColor(accent.id as AccentColor);
                        toast.success(`Accent set to ${accent.label}`);
                      }}
                      className={cn(
                        "relative size-8 rounded-full transition-all cursor-pointer flex items-center justify-center border-0 outline-none hover:scale-105 active:scale-95",
                        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                      )}
                      style={{ backgroundColor: accent.hex }}
                      title={accent.label}
                      aria-label={accent.label}
                    >
                      {isSelected && <Check className="size-4 text-white stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Grouped List Card: Message Bubbles & Wallpaper */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
            Chat Interface
          </p>
          <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
            {/* Bubble Style Sub-segmented Toggle */}
            <div className="p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Bubble Style</span>
                <span className="text-[11px] text-muted-foreground">{activeBubble.label}</span>
              </div>
              <div className="grid grid-cols-3 p-1 rounded-xl bg-muted/60 border border-border/40 gap-1">
                {bubbleOptions.map((bubble) => {
                  const isSelected = preferences.bubbleStyle === bubble.id;
                  return (
                    <button
                      key={bubble.id}
                      type="button"
                      onClick={() => {
                        setBubbleStyle(bubble.id);
                        toast.success(`Bubble style set to ${bubble.label}`);
                      }}
                      className={cn(
                        "py-1.5 px-3 rounded-lg text-xs font-medium transition-all text-center cursor-pointer",
                        isSelected
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      {bubble.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Doodle Wallpaper Smooth Toggle Switch */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0 pr-2">
                <span className="text-xs font-medium text-foreground block">Doodle Wallpaper</span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Subtle textured pattern across conversation background
                </span>
              </div>
              <Switch
                checked={isWallpaperEnabled}
                onCheckedChange={(checked) => {
                  setChatBackground(checked ? "dots" : "default");
                  toast.success(checked ? "Doodle wallpaper enabled" : "Plain wallpaper enabled");
                }}
                aria-label="Toggle doodle wallpaper"
              />
            </div>
          </div>
        </div>

        {/* 4. Grouped List Card: App Icon */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              App Icon
            </span>
            <span className="text-[11px] text-primary font-semibold">
              {APP_ICONS.find((i) => i.id === preferences.appIcon)?.label || "Classic Aether"}
            </span>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/60 p-3 shadow-xs">
            <div className="grid grid-cols-5 gap-2">
              {APP_ICONS.map((icon) => {
                const isSelected = preferences.appIcon === icon.id;
                return (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => {
                      setAppIcon(icon.id);
                      toast.success(`App icon set to ${icon.label}`);
                    }}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    title={icon.label}
                  >
                    <div
                      className={cn(
                        "size-10 rounded-2xl bg-gradient-to-br shadow-sm flex items-center justify-center transition-all group-hover:scale-105 active:scale-95",
                        icon.gradient,
                        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                      )}
                    >
                      {isSelected && <Check className="size-4 text-white stroke-[2.5]" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground text-center truncate max-w-full">
                      {icon.label.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. Grouped List Card: Chat View (Desktop Only) */}
        <div className="space-y-1.5 hidden md:block">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Chat View
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
              Desktop
            </span>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/60 overflow-hidden shadow-xs">
            <div className="p-3.5 flex flex-col gap-2.5">
              <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/60 border border-border/40 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setChatViewMode("single");
                    toast.success("Single chat view activated");
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer",
                    preferences.chatViewMode === "single"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Square className="size-3.5" />
                  <span>Single chat</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setChatViewMode("multi");
                    toast.success("Multi chat split view activated");
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer",
                    preferences.chatViewMode === "multi"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Columns2 className="size-3.5" />
                  <span>Multi chat</span>
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                {preferences.chatViewMode === "single"
                  ? "Standard single chat window layout with sidebar navigation."
                  : "Split window mode allowing two chats to be open in parallel."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
