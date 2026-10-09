"use client";

import Image from "next/image";
import { Check, CheckCheck, CornerUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageMediaCardProps {
  url: string;
  alt?: string;
  timestamp?: string;
  showReceipt?: boolean;
  readBySomeoneElse?: boolean;
  own?: boolean;
  onForward?: () => void;
}

export function ImageMediaCard({
  url,
  alt = "Shared image",
  timestamp,
  showReceipt = false,
  readBySomeoneElse = false,
  own = false,
  onForward,
}: ImageMediaCardProps) {
  return (
    <div className={cn("flex items-end gap-2", own ? "justify-end" : "justify-start")}>
      {/* Outgoing floating forward button (↪) on left */}
      {own && (
        <button
          type="button"
          onClick={onForward}
          title="Forward image"
          aria-label="Forward image"
          className="mb-1.5 grid size-8 shrink-0 place-items-center rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/15 shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <CornerUpRight className="size-4" />
        </button>
      )}

      {/* Sleek Media Card with 16px radius, strict 4:3 aspect ratio and accent border */}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        style={{
          borderRadius: "16px",
          border: "2px solid #ff3b30",
          overflow: "hidden",
          maxWidth: "320px",
          aspectRatio: "4 / 3",
        }}
        className="relative block w-[280px] sm:w-[320px] max-w-[320px] aspect-[4/3] rounded-[16px] overflow-hidden bg-black/40 shadow-lg group select-none transition-transform hover:scale-[1.01]"
      >
        <Image
          src={url}
          alt={alt}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 640px) 75vw, 320px"
        />

        {/* Gradient shadow overlay for badge readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10 pointer-events-none" />

        {/* Bottom-left floating badge: Dark pill showing HD */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
          className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium text-white shadow-md border border-white/10 pointer-events-none"
        >
          <span className="rounded bg-white/20 px-1 py-0.2 text-[9px] font-bold tracking-wider">HD</span>
        </div>

        {/* Bottom-right floating badge: Dark pill showing timestamp and read-receipt checkmarks */}
        {timestamp && (
          <div
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
            className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium text-white shadow-md border border-white/10 pointer-events-none"
          >
            <span>{timestamp}</span>
            {showReceipt && (
              readBySomeoneElse ? (
                <CheckCheck className="size-3 text-white/90" aria-label="Read" />
              ) : (
                <Check className="size-3 text-white/70" aria-label="Sent" />
              )
            )}
          </div>
        )}
      </a>
    </div>
  );
}
