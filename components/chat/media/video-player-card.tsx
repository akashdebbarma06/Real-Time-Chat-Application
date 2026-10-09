"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  CornerUpRight,
  Download,
  Maximize2,
  Pause,
  Play,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoPlayerCardProps {
  url: string;
  name?: string;
  timestamp?: string;
  showReceipt?: boolean;
  readBySomeoneElse?: boolean;
  own?: boolean;
  onForward?: () => void;
}

function formatVideoTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoPlayerCard({
  url,
  name = "Video",
  timestamp,
  showReceipt = false,
  readBySomeoneElse = false,
  own = false,
  onForward,
}: VideoPlayerCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lightboxVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
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

  const openLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
    }
    setIsLightboxOpen(true);
  };

  return (
    <div className={cn("flex items-end gap-2", own ? "justify-end" : "justify-start")}>
      {/* Outgoing floating forward button (↪) on left */}
      {own && (
        <button
          type="button"
          onClick={onForward}
          title="Forward video"
          aria-label="Forward video"
          className="mb-1.5 grid size-8 shrink-0 place-items-center rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/15 shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <CornerUpRight className="size-4" />
        </button>
      )}

      {/* ── Sleek Media Card with 16px radius, 4:3 aspect ratio and 2px accent border ── */}
      <div
        onClick={handleTogglePlay}
        role="button"
        tabIndex={0}
        aria-label={isPlaying ? "Pause video" : "Play video"}
        style={{
          borderRadius: "16px",
          border: "2px solid #ff3b30",
          overflow: "hidden",
          maxWidth: "320px",
          aspectRatio: "4 / 3",
        }}
        className="relative w-[280px] sm:w-[320px] max-w-[320px] aspect-[4/3] rounded-[16px] overflow-hidden bg-black shadow-lg group cursor-pointer select-none"
      >
        {/* Inline Video Element with native browser controls REMOVED */}
        <video
          ref={videoRef}
          src={url}
          preload="metadata"
          playsInline
          muted={isMuted}
          className="size-full object-cover transition-transform duration-300"
        />

        {/* Gradient Overlay for Top & Bottom Badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

        {/* Center overlay: Custom translucent play/pause button */}
        <div
          className={cn(
            "absolute inset-0 grid place-items-center transition-opacity duration-200 pointer-events-none",
            isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          )}
        >
          <div
            style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            className="size-12 rounded-full bg-black/60 text-white grid place-items-center shadow-2xl border border-white/20 group-hover:scale-110 transition-transform"
          >
            {isPlaying ? (
              <Pause className="size-5 fill-white" />
            ) : (
              <Play className="size-5 fill-white translate-x-0.5" />
            )}
          </div>
        </div>

        {/* Top-Right Quick Controls: Mute & Fullscreen */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            className="grid size-7 place-items-center rounded-full bg-black/65 backdrop-blur-md text-white hover:bg-black/85 border border-white/10 transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={openLightbox}
            aria-label="Open fullscreen player"
            className="grid size-7 place-items-center rounded-full bg-black/65 backdrop-blur-md text-white hover:bg-black/85 border border-white/10 transition cursor-pointer"
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>

        {/* Bottom-left floating badge: Dark pill showing HD and duration */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
          className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium text-white shadow-md border border-white/10 pointer-events-none"
        >
          <span className="rounded bg-white/20 px-1 py-0.2 text-[9px] font-bold tracking-wider">HD</span>
          <span>
            {isPlaying
              ? formatVideoTime(currentTime)
              : duration > 0
                ? formatVideoTime(duration)
                : "0:01"}
          </span>
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
      </div>

      {/* ── Fullscreen Lightbox Modal ── */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent
          className="max-w-4xl w-[95vw] sm:w-[90vw] p-0 overflow-hidden bg-black/95 border-white/10 shadow-2xl rounded-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogTitle className="sr-only">{name}</DialogTitle>

          {/* Top Bar Controls */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10 text-white">
            <div className="flex items-center gap-2 min-w-0">
              <Video className="size-4 text-primary shrink-0" />
              <span className="truncate text-xs font-semibold">{name}</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={url}
                download={name}
                className="grid size-8 place-items-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
                title="Download video"
              >
                <Download className="size-4" />
              </a>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setIsLightboxOpen(false)}
                className="size-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Full Video Player */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            <video
              ref={lightboxVideoRef}
              src={url}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="size-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
