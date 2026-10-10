"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBackHandler } from "@/hooks/use-back-handler";

export interface DefaultAvatarOption {
  id: string;
  emoji: string;
  color: string;
  name: string;
}

export const DEFAULT_AVATARS: DefaultAvatarOption[] = [
  { id: "fox", emoji: "🦊", color: "#f97316", name: "Fox" },
  { id: "panda", emoji: "🐼", color: "#14b8a6", name: "Panda" },
  { id: "cat", emoji: "🐱", color: "#8b5cf6", name: "Cat" },
  { id: "rocket", emoji: "🚀", color: "#3b82f6", name: "Rocket" },
  { id: "star", emoji: "⭐", color: "#eab308", name: "Star" },
  { id: "dog", emoji: "🐶", color: "#f59e0b", name: "Dog" },
  { id: "lion", emoji: "🦁", color: "#ef4444", name: "Lion" },
  { id: "tiger", emoji: "🐯", color: "#f97316", name: "Tiger" },
  { id: "unicorn", emoji: "🦄", color: "#ec4899", name: "Unicorn" },
  { id: "robot", emoji: "🤖", color: "#06b6d4", name: "Robot" },
  { id: "gaming", emoji: "🎮", color: "#6366f1", name: "Gaming" },
  { id: "music", emoji: "🎧", color: "#a855f7", name: "Music" },
  { id: "lightning", emoji: "⚡", color: "#eab308", name: "Lightning" },
  { id: "fire", emoji: "🔥", color: "#f43f5e", name: "Fire" },
  { id: "rainbow", emoji: "🌈", color: "#10b981", name: "Rainbow" },
  { id: "avocado", emoji: "🥑", color: "#22c55e", name: "Avocado" },
];

export function generateDefaultAvatarSvg(emoji: string, bgColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="128" fill="${bgColor}"/>
  <text x="50%" y="54%" font-size="120" text-anchor="middle" dominant-baseline="central" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">${emoji}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface ProfilePhotoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCamera: () => void;
  onSelectFile: (file: File) => void;
  onSelectDefaultAvatar: (svgDataUrl: string) => void;
  onRemovePhoto?: () => void;
  loading?: boolean;
}

export function ProfilePhotoSheet({
  open,
  onOpenChange,
  onSelectCamera,
  onSelectFile,
  onSelectDefaultAvatar,
  onRemovePhoto,
  loading = false,
}: ProfilePhotoSheetProps) {
  const [subView, setSubView] = useState<"menu" | "defaults">("menu");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setSubView("menu");
    onOpenChange(false);
  };

  // Priority 1a: Profile Photo Sheet Defaults Subview
  useBackHandler({
    id: "profile-photo-sheet-subview",
    priority: 110,
    enabled: open && subView === "defaults",
    onBack: () => setSubView("menu"),
  });

  // Priority 1: Profile Photo Action Sheet
  useBackHandler({
    id: "profile-photo-sheet",
    priority: 100,
    enabled: open,
    onBack: handleClose,
  });

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
      handleClose();
    }
    // Reset input
    e.target.value = "";
  };

  const handleSelectDefault = (avatar: DefaultAvatarOption) => {
    const svgUrl = generateDefaultAvatarSvg(avatar.emoji, avatar.color);
    onSelectDefaultAvatar(svgUrl);
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Change profile picture"
    >
      <div
        className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 pb-8 shadow-2xl transition-all animate-in slide-in-from-bottom duration-300 text-card-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle Bar */}
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

        {subView === "menu" ? (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <h3 className="text-base font-bold text-foreground">Profile picture</h3>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleClose}
                className="rounded-full size-8 hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* 4 Action Options */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3.5 pt-6 pb-2">
              {/* Option 1: Camera */}
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onSelectCamera();
                }}
                disabled={loading}
                className="group flex flex-col items-center gap-2 cursor-pointer focus:outline-none"
              >
                <div className="grid size-13 sm:size-14 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary shadow-xs transition-transform group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground active:scale-95">
                  <Camera className="size-5.5 sm:size-6" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-foreground tracking-tight">Camera</span>
              </button>

              {/* Option 2: Gallery */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="group flex flex-col items-center gap-2 cursor-pointer focus:outline-none"
              >
                <div className="grid size-13 sm:size-14 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 shadow-xs transition-transform group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white active:scale-95">
                  <ImageIcon className="size-5.5 sm:size-6" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-foreground tracking-tight">Gallery</span>
              </button>

              {/* Option 3: Select Default */}
              <button
                type="button"
                onClick={() => setSubView("defaults")}
                disabled={loading}
                className="group flex flex-col items-center gap-2 cursor-pointer focus:outline-none"
              >
                <div className="grid size-13 sm:size-14 place-items-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-xs transition-transform group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white active:scale-95">
                  <Sparkles className="size-5.5 sm:size-6" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-foreground tracking-tight text-center leading-tight">
                  Select Default
                </span>
              </button>

              {/* Option 4: Remove */}
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onRemovePhoto?.();
                }}
                disabled={loading}
                className="group flex flex-col items-center gap-2 cursor-pointer focus:outline-none"
              >
                <div className="grid size-13 sm:size-14 place-items-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-500 shadow-xs transition-transform group-hover:scale-105 group-hover:bg-rose-500 group-hover:text-white active:scale-95">
                  <Trash2 className="size-5.5 sm:size-6" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-foreground tracking-tight">Remove</span>
              </button>
            </div>

            {/* Hidden Photo Gallery Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div>
            {/* Header with Back Button */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSubView("menu")}
                  className="rounded-full size-8 hover:bg-muted"
                  aria-label="Back to menu"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <h3 className="text-base font-bold text-foreground">Select Default Avatar</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleClose}
                className="rounded-full size-8 hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Emoji / Sticker Grid */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-muted-foreground pb-3 text-center">
                Tap any avatar to set as your profile picture
              </p>
              <div className="grid grid-cols-4 gap-3.5 max-h-[290px] overflow-y-auto scrollbar-thin px-1 py-1">
                {DEFAULT_AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => handleSelectDefault(avatar)}
                    className="group flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:bg-muted/60 transition-all cursor-pointer focus:outline-none"
                    title={`Set ${avatar.name} avatar`}
                  >
                    <div
                      style={{ backgroundColor: avatar.color }}
                      className="grid size-14 place-items-center rounded-full text-2xl shadow-md border-2 border-white/20 transition-transform group-hover:scale-110 active:scale-95"
                    >
                      {avatar.emoji}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground truncate max-w-[60px]">
                      {avatar.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
