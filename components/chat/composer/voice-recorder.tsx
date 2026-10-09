"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, SendHorizontal, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  onCancel: () => void;
  onSendVoice: (audioFile: File) => void;
}

export function VoiceRecorder({ onCancel, onSendVoice }: VoiceRecorderProps) {
  const [seconds, setSeconds] = useState(0);
  const [starting, setStarting] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;

    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        audioChunksRef.current = [];

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
            type: "audio/webm",
          });
          onSendVoice(file);
        };

        recorder.start(200);
        mediaRecorderRef.current = recorder;
        setStarting(false);

        timerRef.current = setInterval(() => {
          setSeconds((s) => s + 1);
        }, 1000);
      } catch (err: unknown) {
        const error = err as Error;
        const msg =
          error.name === "NotAllowedError" || error.name === "PermissionDeniedError"
            ? "Microphone access denied. Please allow microphone permissions."
            : "Could not initialize microphone recording.";
        toast.error("Microphone Error", { description: msg });
        onCancel();
      }
    }

    void startRecording();

    return () => {
      active = false;
      cleanup();
    };
  }, [onCancel, onSendVoice]);

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function handleCancel() {
    cleanup();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    onCancel();
    toast.info("Voice recording cancelled");
  }

  function handleSend() {
    if (seconds < 1) {
      toast.info("Hold to record a longer voice note");
      handleCancel();
      return;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    cleanup();
  }

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 flex items-center justify-between rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 shadow-inner transition-all animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        {starting ? (
          <Loader2 className="size-4 animate-spin text-red-500" />
        ) : (
          <span className="relative flex size-3">
            <span className="animate-ping absolute inline-flex size-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-3 bg-red-500" />
          </span>
        )}
        <span className="font-mono text-xs font-bold text-red-500">
          {starting ? "Starting mic..." : formatTime(seconds)}
        </span>

        {/* Animated wave bars */}
        <div className="hidden sm:flex items-center gap-1 ml-2">
          {[40, 75, 55, 90, 60, 80, 45, 95, 70, 50].map((h, i) => (
            <span
              key={i}
              style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
              className="w-1 bg-red-500/60 rounded-full h-4 animate-pulse"
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleCancel}
          className="size-8 grid place-items-center rounded-full text-muted-foreground hover:text-destructive hover:bg-muted/50 transition cursor-pointer"
          title="Cancel recording"
        >
          <Trash2 className="size-4" />
        </button>

        <Button
          type="button"
          size="icon-sm"
          onClick={handleSend}
          className="size-8 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-500/30 cursor-pointer"
          title="Send voice note"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
