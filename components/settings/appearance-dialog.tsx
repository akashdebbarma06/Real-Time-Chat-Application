"use client";

import { useTheme } from "next-themes";
import {
  Check,
  Laptop,
  Moon,
  Palette,
  RotateCcw,
  Sun,
  X,
} from "lucide-react";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ACCENT_COLORS,
  BUBBLE_STYLES,
  useAppearance,
  type AccentColor,
  type BubbleStyle,
} from "@/lib/appearance-store";
import { cn } from "@/lib/utils";

interface AppearanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppearanceDialog({ open, onOpenChange }: AppearanceDialogProps) {
  const { theme, setTheme } = useTheme();
  const {
    preferences,
    setAccentColor,
    setChatBackground,
    setBubbleStyle,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md w-[calc(100%-2rem)] max-h-[85vh] flex flex-col p-0 gap-0 rounded-2xl border-border bg-card shadow-2xl overflow-hidden"
      >
        <DialogHeader className="p-4 border-b border-border/80 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Palette className="size-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold text-foreground truncate">
                  Appearance
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground truncate">
                  Personalize theme, accents & wallpaper
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 px-2 gap-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                title="Reset all preferences"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </Button>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-4">
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
                "relative rounded-xl border border-border/70 p-3.5 overflow-hidden transition-all duration-300 bg-card/40 shadow-xs",
                isWallpaperEnabled ? "chat-bg-dots" : "chat-bg-default"
              )}
            >
              <div className="relative space-y-2">
                {/* Peer message */}
                <div className="flex items-end gap-2 max-w-[85%]">
                  <div
                    className={cn(
                      "px-3 py-1.5 text-xs bg-muted text-foreground transition-all duration-200 shadow-xs",
                      activeBubble.peerClass
                    )}
                  >
                    <p className="leading-snug">Hey! How does the new theme look? ✨</p>
                    <span className="mt-0.5 block text-[8px] text-muted-foreground text-right">10:42 AM</span>
                  </div>
                </div>

                {/* Own message with active accent */}
                <div className="flex items-end justify-end">
                  <div
                    className={cn(
                      "px-3 py-1.5 max-w-[85%] text-xs bg-primary text-primary-foreground transition-all duration-200 shadow-xs",
                      activeBubble.ownClass
                    )}
                  >
                    <p className="leading-snug font-medium">Clean, minimal, and sleek! 🚀</p>
                    <span className="mt-0.5 block text-[8px] text-primary-foreground/80 text-right">10:43 AM</span>
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
              <div className="p-3 flex flex-col gap-2">
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
              <div className="p-3 flex flex-col gap-2">
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
              <div className="p-3 flex flex-col gap-2">
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

              {/* Wallpaper Toggle Switch */}
              <div className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-medium text-foreground block">Doodle Wallpaper</span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Subtle textured pattern in conversations
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
