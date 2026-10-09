"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceNotePlayerProps {
  url: string;
  own?: boolean;
}

// WhatsApp-style normalized waveform bar heights (percentage of max height)
const WAVEFORM_HEIGHTS = [
  35, 50, 75, 40, 85, 100, 65, 45, 90, 80, 55, 70, 95, 60, 40, 75, 90, 85,
  60, 45, 70, 85, 95, 60, 40, 55, 75, 50, 35, 30,
];

function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VoiceNotePlayer({ url, own = false }: VoiceNotePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
    };
  }, []);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.playbackRate = playbackRate;
      void audio.play().catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = clickRatio * (duration || audio.duration || 1);
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    const nextSpeed: 1 | 1.5 | 2 =
      playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextSpeed);
    if (audio) {
      audio.playbackRate = nextSpeed;
    }
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ width: "270px", maxWidth: "270px", padding: "6px 10px", boxSizing: "border-box" }}
      className="flex flex-col gap-1 select-none w-[270px] max-w-[270px]"
    >
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Main player row */}
      <div className="flex items-center gap-2">
        {/* Play / Pause Toggle Button: 32px × 32px */}
        <button
          type="button"
          onClick={togglePlayPause}
          aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
          style={{ width: "32px", height: "32px" }}
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full transition-transform active:scale-95 cursor-pointer shadow-sm",
            own
              ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isPlaying ? (
            <Pause className="size-3.5 fill-current" />
          ) : (
            <Play className="size-3.5 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Interactive Waveform Seeking Container: limit height to 22px */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div
            onClick={handleSeek}
            role="slider"
            aria-label="Voice note scrubber"
            aria-valuenow={Math.round(progress * 100)}
            style={{ height: "22px" }}
            className="flex items-center gap-0.5 h-[22px] max-h-[22px] cursor-pointer group py-0"
          >
            {WAVEFORM_HEIGHTS.map((heightPercent, index) => {
              const barRatio = index / WAVEFORM_HEIGHTS.length;
              const isPlayed = barRatio <= progress;

              return (
                <span
                  key={index}
                  style={{ height: `${heightPercent}%` }}
                  className={cn(
                    "flex-1 min-w-0.5 max-w-1.25 rounded-full transition-all group-hover:opacity-90",
                    isPlayed
                      ? own
                        ? "bg-primary-foreground"
                        : "bg-primary"
                      : own
                        ? "bg-primary-foreground/35"
                        : "bg-muted-foreground/35"
                  )}
                />
              );
            })}
          </div>

          {/* Time & Speed Controls */}
          <div
            className={cn(
              "flex items-center justify-between text-[10px] font-mono leading-none",
              own ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-1">
              <Mic className="size-2.5 opacity-70" />
              <span>
                {isPlaying
                  ? formatAudioTime(currentTime)
                  : formatAudioTime(duration || currentTime)}
              </span>
            </div>

            {/* Speed Multiplier Pill */}
            <button
              type="button"
              onClick={cycleSpeed}
              aria-label="Change voice note speed"
              className={cn(
                "px-1.5 py-0.2 rounded-full text-[9px] font-bold font-sans tracking-wide transition cursor-pointer active:scale-95",
                own
                  ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
                  : "bg-foreground/10 text-foreground hover:bg-foreground/15"
              )}
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
