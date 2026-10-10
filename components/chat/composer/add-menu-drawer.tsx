"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Film,
  Search,
  Smile,
  Sticker,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export type MediaTab = "emoji" | "gif" | "sticker";

interface AddQuickMenuProps {
  onSelectTab: (tab: MediaTab) => void;
}

export function AddQuickMenu({ onSelectTab }: AddQuickMenuProps) {
  return (
    <div
      role="menu"
      aria-label="Media options"
      className="absolute bottom-full left-0 mb-3 z-30 w-44 rounded-2xl border border-border bg-popover/95 text-popover-foreground backdrop-blur-2xl p-1.5 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
    >
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => onSelectTab("emoji")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors cursor-pointer text-left"
        >
          <div className="grid size-7 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
            <Smile className="size-4" />
          </div>
          <span>Emoji</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("gif")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors cursor-pointer text-left"
        >
          <div className="grid size-7 place-items-center rounded-lg bg-pink-500/10 text-pink-500">
            <span className="text-[10px] font-black tracking-tighter">GIF</span>
          </div>
          <span>GIF</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("sticker")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors cursor-pointer text-left"
        >
          <div className="grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Sticker className="size-4" />
          </div>
          <span>Sticker</span>
        </button>
      </div>
    </div>
  );
}

// Curated GIF presets (reliable public CDN GIFs for instant rich chat)
const CURATED_GIFS = [
  { id: "1", title: "Excited Dance", url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif" },
  { id: "2", title: "Thumbs Up", url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif" },
  { id: "3", title: "Mind Blown", url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif" },
  { id: "4", title: "Party Celebration", url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif" },
  { id: "5", title: "Applause Clap", url: "https://media.giphy.com/media/fnK0jeA8vIh2QLq3IZ/giphy.gif" },
  { id: "6", title: "Laughing Cat", url: "https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif" },
  { id: "7", title: "High Five", url: "https://media.giphy.com/media/pHb82xtBPfqEg/giphy.gif" },
  { id: "8", title: "Thinking", url: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif" },
];

const CURATED_STICKERS = [
  { id: "s1", emoji: "🚀", label: "To The Moon" },
  { id: "s2", emoji: "🎉", label: "Celebrate" },
  { id: "s3", emoji: "❤️", label: "Much Love" },
  { id: "s4", emoji: "🔥", label: "Super Hot" },
  { id: "s5", emoji: "👑", label: "Champion" },
  { id: "s6", emoji: "✨", label: "Magic Vibe" },
  { id: "s7", emoji: "☕", label: "Coffee Break" },
  { id: "s8", emoji: "💯", label: "Top Score" },
  { id: "s9", emoji: "🎯", label: "Bullseye" },
  { id: "s10", emoji: "🦄", label: "Unicorn" },
  { id: "s11", emoji: "😎", label: "Stay Cool" },
  { id: "s12", emoji: "🏆", label: "Victory" },
];

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥹", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🫡", "🤐"],
  },
  {
    name: "Gestures",
    emojis: ["👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏"],
  },
  {
    name: "Hearts & Sparkles",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "✨", "⭐", "🌟", "💫", "🔥", "💥", "💯", "🎉", "🎊"],
  },
];

interface FullMediaDrawerProps {
  initialTab: MediaTab;
  onSelectEmoji: (emoji: string) => void;
  onSelectGif: (gifUrl: string) => void;
  onSelectSticker: (stickerEmoji: string, label: string) => void;
  onClose: () => void;
}

export function FullMediaDrawer({
  initialTab,
  onSelectEmoji,
  onSelectGif,
  onSelectSticker,
  onClose,
}: FullMediaDrawerProps) {
  const [activeTab, setActiveTab] = useState<MediaTab>(initialTab);
  const [search, setSearch] = useState("");

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return EMOJI_CATEGORIES;
    const q = search.toLowerCase();
    return EMOJI_CATEGORIES.map((cat) => ({
      ...cat,
      emojis: cat.emojis.filter(() => cat.name.toLowerCase().includes(q) || true),
    }));
  }, [search]);

  const filteredGifs = useMemo(() => {
    if (!search.trim()) return CURATED_GIFS;
    const q = search.toLowerCase();
    return CURATED_GIFS.filter((g) => g.title.toLowerCase().includes(q));
  }, [search]);

  const filteredStickers = useMemo(() => {
    if (!search.trim()) return CURATED_STICKERS;
    const q = search.toLowerCase();
    return CURATED_STICKERS.filter((s) => s.label.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="absolute bottom-full left-0 mb-3 z-30 w-full sm:w-96 rounded-3xl border border-border bg-popover/95 text-popover-foreground backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
      {/* Header Tabs & Close */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("emoji")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === "emoji"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Smile className="size-3.5" />
            <span>Emoji</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gif")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === "gif"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Film className="size-3.5" />
            <span>GIF</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sticker")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === "sticker"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Sticker className="size-3.5" />
            <span>Sticker</span>
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="size-7 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 rounded-xl text-xs bg-muted/40 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40"
          />
        </div>
      </div>

      {/* Content Container */}
      <div className="h-60 overflow-y-auto scrollbar-thin p-3">
        {/* EMOJI TAB */}
        {activeTab === "emoji" && (
          <div className="space-y-4">
            {filteredEmojis.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {cat.name}
                </span>
                <div className="grid grid-cols-8 gap-1">
                  {cat.emojis.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => onSelectEmoji(em)}
                      className="grid size-8 place-items-center rounded-lg text-lg hover:bg-muted hover:scale-125 transition-transform cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GIF TAB */}
        {activeTab === "gif" && (
          <div className="grid grid-cols-2 gap-2">
            {filteredGifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onSelectGif(gif.url)}
                className="group relative h-24 overflow-hidden rounded-xl border bg-muted/40 transition hover:opacity-90 active:scale-95 cursor-pointer"
              >
                <Image
                  src={gif.url}
                  alt={gif.title}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
                  {gif.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* STICKER TAB */}
        {activeTab === "sticker" && (
          <div className="grid grid-cols-3 gap-2">
            {filteredStickers.map((stk) => (
              <button
                key={stk.id}
                type="button"
                onClick={() => onSelectSticker(stk.emoji, stk.label)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-border/60 bg-muted/30 hover:bg-muted/70 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span className="text-3xl drop-shadow-sm">{stk.emoji}</span>
                <span className="mt-1 text-[10px] font-semibold text-muted-foreground">
                  {stk.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
