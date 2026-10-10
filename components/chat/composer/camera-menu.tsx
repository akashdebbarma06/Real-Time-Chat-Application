"use client";

import { Camera, CircleDot, Video } from "lucide-react";

interface CameraMenuProps {
  onSelectVideo: () => void;
  onSelectPhoto: () => void;
  onSelectVideoNote: () => void;
}

export function CameraMenu({
  onSelectVideo,
  onSelectPhoto,
  onSelectVideoNote,
}: CameraMenuProps) {
  return (
    <div
      role="menu"
      aria-label="Camera options"
      className="absolute bottom-full right-10 sm:right-14 mb-3 z-30 w-48 rounded-2xl border border-border bg-popover/95 text-popover-foreground backdrop-blur-2xl p-1.5 shadow-2xl shadow-black/20 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
    >
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={onSelectVideo}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-popover-foreground hover:bg-muted transition-colors cursor-pointer text-left"
        >
          <div className="grid size-7 place-items-center rounded-lg bg-red-500/10 text-red-500">
            <Video className="size-4" />
          </div>
          <span>Video</span>
        </button>

        <button
          type="button"
          onClick={onSelectPhoto}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-popover-foreground hover:bg-muted transition-colors cursor-pointer text-left"
        >
          <div className="grid size-7 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
            <Camera className="size-4" />
          </div>
          <span>Photo</span>
        </button>

        <button
          type="button"
          onClick={onSelectVideoNote}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-popover-foreground hover:bg-muted transition-colors cursor-pointer text-left"
        >
          <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <CircleDot className="size-4" />
          </div>
          <span>Video Note</span>
        </button>
      </div>
    </div>
  );
}
