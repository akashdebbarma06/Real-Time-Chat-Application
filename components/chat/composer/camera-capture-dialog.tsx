"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  CircleDot,
  Loader2,
  RefreshCw,
  Video,
  X,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type CameraMode = "photo" | "video" | "video-note";

interface CameraCaptureDialogProps {
  open: boolean;
  mode: CameraMode;
  onOpenChange: (open: boolean) => void;
  onCaptureMedia: (file: File, objectUrl?: string) => void;
}

export function CameraCaptureDialog({
  open,
  mode,
  onOpenChange,
  onCaptureMedia,
}: CameraCaptureDialogProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start camera stream on dialog open
  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    async function initCamera() {
      setLoading(true);
      setPermissionError(null);

      try {
        const constraints: MediaStreamConstraints =
          mode === "video-note"
            ? {
                video: {
                  facingMode: "user",
                  width: { ideal: 480 },
                  height: { ideal: 480 },
                },
                audio: true,
              }
            : mode === "photo"
              ? {
                  video: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  },
                  audio: false,
                }
              : {
                  video: true,
                  audio: true,
                };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
        }
      } catch (err: unknown) {
        const error = err as Error;
        const msg =
          error.name === "NotAllowedError" || error.name === "PermissionDeniedError"
            ? "Camera/Microphone permission denied. Please allow access in browser settings."
            : error.message || "Failed to access camera device.";
        setPermissionError(msg);
        toast.error("Camera access failed", { description: msg });
      } finally {
        setLoading(false);
      }
    }

    void initCamera();

    return () => {
      stopCamera();
    };
  }, [open, mode]);

  function stopCamera() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setRecording(false);
    setRecordSeconds(0);
  }

  // 1. Photo Snapshot Capture
  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Failed to capture image snapshot");
          return;
        }
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const objectUrl = URL.createObjectURL(file);
        stopCamera();
        onOpenChange(false);
        onCaptureMedia(file, objectUrl);
      },
      "image/jpeg",
      0.9
    );
  }

  // 2. Video & Video Note Recording
  function startVideoRecording() {
    if (!stream) return;
    recordedChunksRef.current = [];

    try {
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const prefix = mode === "video-note" ? "video-note" : "camera-capture";
        const file = new File([blob], `${prefix}-${Date.now()}.webm`, {
          type: "video/webm",
        });
        const objectUrl = URL.createObjectURL(file);
        stopCamera();
        onOpenChange(false);
        onCaptureMedia(file, objectUrl);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((sec) => sec + 1);
      }, 1000);
    } catch {
      toast.error("Failed to start video recording");
    }
  }

  function stopVideoRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const title =
    mode === "photo"
      ? "Take a Photo"
      : mode === "video-note"
        ? "Record Video Note"
        : "Record Video";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-5 bg-card border shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
              {mode === "photo" ? (
                <Camera className="size-4" />
              ) : mode === "video-note" ? (
                <CircleDot className="size-4" />
              ) : (
                <Video className="size-4" />
              )}
            </div>
            <DialogTitle className="text-base font-bold">{title}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Viewfinder Area */}
        {mode === "video-note" ? (
          <div className="py-2 flex items-center justify-center">
            <div
              style={{
                width: "240px",
                height: "240px",
                aspectRatio: "1 / 1",
                borderRadius: "50%",
                overflow: "hidden",
                margin: "0 auto",
              }}
              className="relative bg-black flex items-center justify-center border-4 border-primary/70 shadow-2xl shrink-0"
            >
              {loading && (
                <div className="flex flex-col items-center gap-2 text-white/80">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-xs">Accessing camera device...</p>
                </div>
              )}

              {permissionError && (
                <div className="p-4 text-center space-y-2 text-white">
                  <AlertCircle className="size-8 text-rose-500 mx-auto" />
                  <p className="text-xs text-rose-300 font-semibold">{permissionError}</p>
                </div>
              )}

              {/* Live Video Stream (Mirrored, Object Cover, 100% W/H) */}
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                }}
              />

              {/* Recording Timer Badge */}
              {recording && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/75 px-3 py-1 text-xs font-mono font-bold text-white border border-red-500/50 backdrop-blur-md">
                  <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                  <span>{formatTimer(recordSeconds)}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black flex items-center justify-center">
            {loading && (
              <div className="flex flex-col items-center gap-2 text-white/80">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-xs">Accessing camera device...</p>
              </div>
            )}

            {permissionError && (
              <div className="p-4 text-center space-y-2 text-white">
                <AlertCircle className="size-8 text-rose-500 mx-auto" />
                <p className="text-xs text-rose-300 font-semibold">{permissionError}</p>
              </div>
            )}

            {/* Live Video Stream */}
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: mode === "photo" ? "scaleX(-1)" : "none",
              }}
            />

            {/* Recording Timer Badge */}
            {recording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-mono font-bold text-white border border-red-500/40">
                <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                <span>{formatTimer(recordSeconds)}</span>
              </div>
            )}
          </div>
        )}

        {/* Hidden Canvas for Photo Snap */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 pt-3">
          {mode === "photo" ? (
            <Button
              type="button"
              disabled={loading || !stream}
              onClick={capturePhoto}
              className="size-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 cursor-pointer"
            >
              <Camera className="size-6" />
            </Button>
          ) : recording ? (
            <Button
              type="button"
              onClick={stopVideoRecording}
              className="size-14 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30 cursor-pointer animate-pulse"
            >
              <div className="size-5 bg-white rounded-xs" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={loading || !stream}
              onClick={startVideoRecording}
              className="size-14 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30 cursor-pointer"
            >
              <div className="size-5 rounded-full bg-white" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
