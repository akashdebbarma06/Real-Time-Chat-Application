"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, CornerUpRight, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoNoteBubbleProps {
  url: string;
  timestamp?: string;
  showReceipt?: boolean;
  readBySomeoneElse?: boolean;
  own?: boolean;
  onForward?: () => void;
}

function formatNoteTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoNoteBubble({
  url,
  timestamp,
  showReceipt = false,
  readBySomeoneElse = false,
  own = false,
  onForward,
}: VideoNoteBubbleProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      video.currentTime = 0;
      setCurrentTime(0);
    };

    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.addEventListener("pause", onPause);
    video.addEventListener("play", onPlay);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("play", onPlay);
    };
  }, []);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.muted = isMuted;
      void video.play().catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    video.muted = nextMuted;
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  // Circumference for r=47: 2 * Math.PI * 47 ≈ 295.31
  const circumference = 295.31;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={cn("flex items-end gap-2.5", own ? "justify-end" : "justify-start")}>
      {/* Outgoing Quick-Forward Button (curved arrow ↪) floating to the left */}
      {own && (
        <button
          type="button"
          onClick={onForward}
          title="Forward video note"
          aria-label="Forward video note"
          className="mb-6 grid size-8 shrink-0 place-items-center rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/15 shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <CornerUpRight className="size-4" />
        </button>
      )}

      {/* Standalone Circular Video Note Column */}
      <div className={cn("flex flex-col", own ? "items-end" : "items-start")}>
        {/* Strict 1:1 circular container with accent border 3px solid var(--primary) */}
        <div
          onClick={handleTogglePlay}
          role="button"
          tabIndex={0}
          aria-label={isPlaying ? "Pause circular video note" : "Play circular video note"}
          style={{
            width: "220px",
            height: "220px",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            overflow: "hidden",
            border: "3px solid var(--primary)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
          }}
          className="relative bg-black group cursor-pointer select-none shrink-0 transition-transform active:scale-98"
        >
          {/* Child <video> without native browser controls */}
          <video
            ref={videoRef}
            src={url}
            playsInline
            preload="metadata"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
            }}
          />

          {/* Circular progress ring (SVG) */}
          <svg
            className="absolute inset-0 size-full pointer-events-none -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Track circle */}
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-white/20"
            />
            {/* Animated Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-white transition-[stroke-dashoffset] duration-150 ease-linear"
            />
          </svg>

          {/* Center overlay: Circular play/pause toggle button (backdrop-filter: blur(2px)) */}
          <div
            className={cn(
              "absolute inset-0 grid place-items-center transition-opacity duration-200 pointer-events-none",
              isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
            )}
          >
            <div
              style={{
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
              }}
              className="size-12 rounded-full bg-black/60 text-white grid place-items-center shadow-2xl border border-white/20 group-hover:scale-110 transition-transform"
            >
              {isPlaying ? (
                <Pause className="size-5 fill-white" />
              ) : (
                <Play className="size-5 fill-white translate-x-0.5" />
              )}
            </div>
          </div>

          {/* Mute toggle button in top corner */}
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            className="absolute top-3 right-3 z-10 size-7 rounded-full bg-black/65 backdrop-blur-md text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/85 cursor-pointer"
          >
            {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
          </button>

          {/* Bottom-center overlay: Video duration badge (e.g., 0:02) */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 pointer-events-none rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium text-white shadow-md border border-white/10"
          >
            <span>
              {isPlaying
                ? formatNoteTime(currentTime)
                : formatNoteTime(duration || currentTime)}
            </span>
          </div>
        </div>

        {/* External floating timestamp pill below/beside the circle */}
        {timestamp && (
          <div
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
            className="mt-1.5 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono text-white shadow-md border border-white/10"
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
      </div>
    </div>
  );
}
