"use client";

import { useTheme } from "next-themes";
import {
  Check,
  Laptop,
  MessageCircleMore,
  Moon,
  Palette,
  RotateCcw,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface AppearanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppearanceDialog({ open, onOpenChange }: AppearanceDialogProps) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-xl w-[calc(100%-2rem)] h-[88vh] max-h-[820px] flex flex-col p-0 gap-0 rounded-3xl border-border bg-card shadow-2xl overflow-hidden"
      >
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Palette className="size-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold text-foreground truncate">
                  Appearance & Personalization
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground truncate">
                  Customize themes, colors, app icon, and bubble styling
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 gap-1.5 rounded-xl text-xs font-semibold hover:bg-muted cursor-pointer"
                title="Reset all appearance preferences"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset</span>
              </Button>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="grid size-8 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Live Interactive Preview Box */}
        <div className="p-4 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              <span>Live Preview</span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground/80">
              {activeAccent.label} · {activeBubble.label}
            </span>
          </div>

          <div
            className={cn(
              "relative rounded-2xl p-4 border border-border/80 overflow-hidden transition-all duration-300 shadow-inner",
              activeBg.className
            )}
          >
            <div className="space-y-3">
              {/* Peer message preview */}
              <div className="flex items-end gap-2">
                <div className="grid size-6 place-items-center rounded-full bg-muted-foreground/20 text-[10px] font-bold text-foreground">
                  A
                </div>
                <div
                  className={cn(
                    "px-3.5 py-2 max-w-[80%] text-xs bg-muted text-foreground transition-all duration-200 shadow-xs",
                    activeBubble.peerClass
                  )}
                >
                  <p className="font-medium">Hey! How does the new theme look? ✨</p>
                  <span className="mt-1 block text-[9px] text-muted-foreground text-right">10:42 AM</span>
                </div>
              </div>

              {/* Own message preview */}
              <div className="flex items-end justify-end gap-2">
                <div
                  className={cn(
                    "px-3.5 py-2 max-w-[80%] text-xs bg-primary text-primary-foreground transition-all duration-200 shadow-xs shadow-primary/20",
                    activeBubble.ownClass
                  )}
                >
                  <p className="font-medium">Love it! Everything matches my style perfectly 🚀</p>
                  <span className="mt-1 block text-[9px] text-primary-foreground/80 text-right">10:43 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customization Options List */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-4 sm:px-5 py-4 overscroll-contain">
          <div className="space-y-6 pb-2">
            {/* 1. THEME MODE */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Theme Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "light", label: "Light", icon: Sun, desc: "Clean daylight" },
                  { id: "dark", label: "Dark", icon: Moon, desc: "Gentle on eyes" },
                  { id: "system", label: "System", icon: Laptop, desc: "Follows OS" },
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
                        "flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/40 font-semibold"
                          : "border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="size-5" />
                      <span className="text-xs">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground/75 font-normal">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. CHAT THEME / ACCENT COLOR */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Chat Theme Accent
                </label>
                <span className="text-[11px] text-primary font-semibold">
                  {activeAccent.label}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ACCENT_COLORS.map((accent) => {
                  const isSelected = preferences.accentColor === accent.id;
                  return (
                    <button
                      key={accent.id}
                      type="button"
                      onClick={() => {
                        setAccentColor(accent.id as AccentColor);
                        toast.success(`Chat theme set to ${accent.label}`);
                      }}
                      className={cn(
                        "flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                          : "border-border bg-card/60 hover:bg-muted"
                      )}
                    >
                      <div
                        className="size-7 rounded-xl shrink-0 flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: accent.hex }}
                      >
                        {isSelected && <Check className="size-4 stroke-[3]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs truncate font-medium", isSelected ? "text-primary font-semibold" : "text-foreground")}>
                          {accent.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{accent.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. MESSAGE BUBBLE STYLES */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Message Bubble Style
                </label>
                <span className="text-[11px] text-primary font-semibold">
                  {activeBubble.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {BUBBLE_STYLES.map((bubble) => {
                  const isSelected = preferences.bubbleStyle === bubble.id;
                  return (
                    <button
                      key={bubble.id}
                      type="button"
                      onClick={() => {
                        setBubbleStyle(bubble.id as BubbleStyle);
                        toast.success(`Bubble style set to ${bubble.label}`);
                      }}
                      className={cn(
                        "flex flex-col gap-2 rounded-2xl border p-3 text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                          : "border-border bg-card/60 hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xs font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                          {bubble.label}
                        </span>
                        {isSelected && <Check className="size-4 text-primary" />}
                      </div>

                      {/* Mini bubble visual preview */}
                      <div className="flex items-center gap-1.5 py-1">
                        <div
                          className={cn(
                            "h-5 px-2 bg-muted text-[10px] flex items-center justify-center text-muted-foreground",
                            bubble.peerClass
                          )}
                        >
                          Hi
                        </div>
                        <div
                          className={cn(
                            "h-5 px-2 bg-primary text-[10px] flex items-center justify-center text-primary-foreground font-semibold",
                            bubble.ownClass
                          )}
                        >
                          Hello!
                        </div>
                      </div>

                      <p className="text-[10px] text-muted-foreground leading-tight">{bubble.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. OVERALL APP THEME / CHAT WALLPAPER */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Overall App Theme & Wallpaper
                </label>
                <span className="text-[11px] text-primary font-semibold">
                  {activeBg.label}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CHAT_BACKGROUNDS.map((bg) => {
                  const isSelected = preferences.chatBackground === bg.id;
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => {
                        setChatBackground(bg.id as ChatBackground);
                        toast.success(`Chat theme set to ${bg.label}`);
                      }}
                      className={cn(
                        "flex flex-col gap-2 rounded-2xl border p-2.5 text-left transition-all cursor-pointer overflow-hidden",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                          : "border-border bg-card/60 hover:bg-muted"
                      )}
                    >
                      <div
                        className={cn(
                          "h-12 w-full rounded-xl border border-border/80 flex items-center justify-center shadow-inner",
                          bg.className
                        )}
                      >
                        {isSelected && (
                          <div className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                            <Check className="size-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={cn("text-xs font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>
                          {bg.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{bg.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. APP ICON PERSONALIZER */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Personalize App Icon
                </label>
                <span className="text-[11px] text-primary font-semibold">
                  {activeIcon.label}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {APP_ICONS.map((iconOption) => {
                  const isSelected = preferences.appIcon === iconOption.id;
                  return (
                    <button
                      key={iconOption.id}
                      type="button"
                      onClick={() => {
                        setAppIcon(iconOption.id as AppIconChoice);
                        toast.success(`App icon updated to ${iconOption.label}`);
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border p-2.5 text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                          : "border-border bg-card/60 hover:bg-muted"
                      )}
                    >
                      <div
                        className={cn(
                          "grid size-11 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md shrink-0 transition-transform hover:scale-105",
                          iconOption.gradient,
                          iconOption.id === "midnight" && "border border-white/20 text-zinc-100"
                        )}
                      >
                        <MessageCircleMore className="size-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={cn("text-xs font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>
                            {iconOption.label}
                          </p>
                          {isSelected && <Check className="size-4 text-primary shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{iconOption.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
