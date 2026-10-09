"use client";

import Image from "next/image";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface StickerBubbleProps {
  emoji?: string;
  label?: string;
  imageUrl?: string;
  timestamp?: string;
  showReceipt?: boolean;
  readBySomeoneElse?: boolean;
  own?: boolean;
}

export function StickerBubble({
  emoji,
  label,
  imageUrl,
  timestamp,
  showReceipt = false,
  readBySomeoneElse = false,
  own = false,
}: StickerBubbleProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col group select-none select-text",
        own ? "items-end" : "items-start"
      )}
    >
      {/* Standalone Sticker: No background bubble borders or markdown text */}
      <div
        title={label || "Sticker"}
        className="relative flex items-center justify-center p-1 transition-transform hover:scale-110 active:scale-95 duration-200 cursor-pointer"
      >
        {imageUrl ? (
          <div className="relative size-28 sm:size-32">
            <Image
              src={imageUrl}
              alt={label || "Sticker"}
              fill
              unoptimized
              className="object-contain drop-shadow-lg"
            />
          </div>
        ) : (
          <span className="text-6xl sm:text-7xl select-none leading-none drop-shadow-md py-1">
            {emoji || "✨"}
          </span>
        )}
      </div>

      {/* Floating subtle timestamp badge */}
      {timestamp && (
        <div
          className={cn(
            "flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono text-muted-foreground bg-background/50 backdrop-blur-xs border border-border/40 shadow-xs",
            own ? "self-end" : "self-start"
          )}
        >
          <span>{timestamp}</span>
          {own && showReceipt && (
            readBySomeoneElse ? (
              <CheckCheck className="size-3 text-primary" aria-label="Read" />
            ) : (
              <Check className="size-3 text-muted-foreground" aria-label="Sent" />
            )
          )}
        </div>
      )}
    </div>
  );
}
