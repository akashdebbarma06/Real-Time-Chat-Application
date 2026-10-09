"use client";

import { useTheme } from "next-themes";
import {
  ArrowLeft,
  Check,
  Laptop,
  MessageCircleMore,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  ACCENT_COLORS,
  APP_ICONS,
  BUBBLE_STYLES,
  CHAT_BACKGROUNDS,
  useAppearance,
  type AccentColor,
  type AppIconChoice,
  type BubbleStyle,
  type ChatBackground,
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
    resetPreferences,
  } = useAppearance();

  const activeAccent = ACCENT_COLORS.find((c) => c.id === preferences.accentColor) || ACCENT_COLORS[0];
  const activeBubble = BUBBLE_STYLES.find((b) => b.id === preferences.bubbleStyle) || BUBBLE_STYLES[0];
  const activeBg = CHAT_BACKGROUNDS.find((g) => g.id === preferences.chatBackground) || CHAT_BACKGROUNDS[0];
  const activeIcon = APP_ICONS.find((i) => i.id === preferences.appIcon) || APP_ICONS[0];

  function handleReset() {
    resetPreferences();
    setTheme("system");
    toast.success("Appearance reset to defaults");
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
      {/* Side Panel Header with Back Button */}
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
            <p className="text-[11px] text-muted-foreground truncate">Personalize chat & theme</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="h-7 px-2.5 gap-1 rounded-xl text-xs font-semibold hover:bg-muted shrink-0"
          title="Reset to default appearance"
        >
          <RotateCcw className="size-3" />
          <span>Reset</span>
        </Button>
      </div>

      {/* Scrollable Customization Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-5">
        {/* Live Interactive Preview Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Sparkles className="size-3.5 text-primary" />
              Live Preview
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/75 truncate">
              {activeAccent.label}
            </span>
          </div>

          <div
            className={cn(
              "relative rounded-2xl p-3 border border-border/80 overflow-hidden transition-all duration-300 shadow-inner",
              activeBg.className
            )}
          >
            <div className="space-y-2.5">
              {/* Peer message preview */}
              <div className="flex items-end gap-1.5">
                <div className="grid size-5 place-items-center rounded-full bg-muted-foreground/20 text-[9px] font-bold text-foreground shrink-0">
                  A
                </div>
                <div
                  className={cn(
                    "px-3 py-1.5 max-w-[85%] text-xs bg-muted text-foreground transition-all duration-200 shadow-xs",
                    activeBubble.peerClass
                  )}
                >
                  <p className="leading-snug">Hey! How does this look? ✨</p>
                  <span className="mt-0.5 block text-[8px] text-muted-foreground text-right">10:42 AM</span>
                </div>
              </div>

              {/* Own message preview */}
              <div className="flex items-end justify-end gap-1.5">
                <div
                  className={cn(
                    "px-3 py-1.5 max-w-[85%] text-xs bg-primary text-primary-foreground transition-all duration-200 shadow-xs shadow-primary/20",
                    activeBubble.ownClass
                  )}
                >
                  <p className="leading-snug font-medium">Loving the new look! 🚀</p>
                  <span className="mt-0.5 block text-[8px] text-primary-foreground/80 text-right">10:43 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Theme Mode */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
            Theme Mode
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "system", label: "System", icon: Laptop },
            ].map((item) => {
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
                    "flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 px-2 transition-all cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/40 font-semibold"
                      : "border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Chat Accent Colors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Chat Accent
            </label>
            <span className="text-[11px] text-primary font-semibold truncate">
              {activeAccent.label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
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
                    "flex items-center gap-2 rounded-xl border p-2 text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                      : "border-border bg-card/60 hover:bg-muted"
                  )}
                >
                  <div
                    className="size-6 rounded-lg shrink-0 flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: accent.hex }}
                  >
                    {isSelected && <Check className="size-3.5 stroke-[3]" />}
                  </div>
                  <span className={cn("text-xs truncate font-medium", isSelected ? "text-primary font-semibold" : "text-foreground")}>
                    {accent.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Message Bubble Style */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Bubble Style
            </label>
            <span className="text-[11px] text-primary font-semibold truncate">
              {activeBubble.label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {BUBBLE_STYLES.map((bubble) => {
              const isSelected = preferences.bubbleStyle === bubble.id;
              return (
                <button
                  key={bubble.id}
                  type="button"
                  onClick={() => {
                    setBubbleStyle(bubble.id as BubbleStyle);
                    toast.success(`Bubble set to ${bubble.label}`);
                  }}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                      : "border-border bg-card/60 hover:bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                      {bubble.label}
                    </span>
                    {isSelected && <Check className="size-3.5 text-primary" />}
                  </div>

                  <div className="flex items-center gap-1 py-0.5">
                    <div className={cn("h-4 px-1.5 bg-muted text-[9px] flex items-center text-muted-foreground", bubble.peerClass)}>
                      Hi
                    </div>
                    <div className={cn("h-4 px-1.5 bg-primary text-[9px] flex items-center text-primary-foreground font-semibold", bubble.ownClass)}>
                      Hello!
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Chat Wallpaper */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Chat Wallpaper
            </label>
            <span className="text-[11px] text-primary font-semibold truncate">
              {activeBg.label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {CHAT_BACKGROUNDS.map((bg) => {
              const isSelected = preferences.chatBackground === bg.id;
              return (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => {
                    setChatBackground(bg.id as ChatBackground);
                    toast.success(`Wallpaper set to ${bg.label}`);
                  }}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-xl border p-2 text-left transition-all cursor-pointer overflow-hidden",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                      : "border-border bg-card/60 hover:bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-full rounded-lg border border-border/80 flex items-center justify-center shadow-inner",
                      bg.className
                    )}
                  >
                    {isSelected && (
                      <div className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="size-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className={cn("text-xs font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>
                    {bg.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. App Icon Personalizer */}
        <div className="space-y-2 pb-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              App Icon
            </label>
            <span className="text-[11px] text-primary font-semibold truncate">
              {activeIcon.label}
            </span>
          </div>
          <div className="space-y-1.5">
            {APP_ICONS.map((iconOption) => {
              const isSelected = preferences.appIcon === iconOption.id;
              return (
                <button
                  key={iconOption.id}
                  type="button"
                  onClick={() => {
                    setAppIcon(iconOption.id as AppIconChoice);
                    toast.success(`App icon set to ${iconOption.label}`);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border p-2 text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                      : "border-border bg-card/60 hover:bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "grid size-8 place-items-center rounded-xl bg-gradient-to-br text-white shadow-xs shrink-0",
                      iconOption.gradient,
                      iconOption.id === "midnight" && "border border-white/20 text-zinc-100"
                    )}
                  >
                    <MessageCircleMore className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-xs font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>
                      {iconOption.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{iconOption.description}</p>
                  </div>
                  {isSelected && <Check className="size-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
