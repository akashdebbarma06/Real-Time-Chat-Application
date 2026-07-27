"use client";

import { useState } from "react";
import {
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  ScreenShare,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInitials } from "@/lib/utils";

interface CallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  peerAvatarUrl?: string | null;
  mode?: "video" | "audio";
}

export function CallModal({
  open,
  onOpenChange,
  title,
  peerAvatarUrl,
  mode = "video",
}: CallModalProps) {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);

  function toggleScreenShare() {
    if (screenSharing) {
      setScreenSharing(false);
      toast.info("Screen sharing stopped");
    } else {
      setScreenSharing(true);
      toast.success("Sharing your screen...");
    }
  }

  function handleEndCall() {
    toast.info("Call ended");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-slate-950 border-slate-800 text-slate-100 p-0 overflow-hidden rounded-3xl shadow-2xl h-[520px] flex flex-col justify-between">
        <DialogHeader className="p-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{mode === "video" ? "Video Call" : "Audio Call"} with {title}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Video / Screen Share Call Stage */}
        <div className="relative flex-1 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center">
          {screenSharing ? (
            <div className="flex flex-col items-center space-y-3 animate-in fade-in zoom-in duration-300">
              <div className="grid size-20 place-items-center rounded-3xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-2xl">
                <Monitor className="size-10" />
              </div>
              <p className="text-base font-bold text-slate-100">Sharing Screen with {title}</p>
              <p className="text-xs text-slate-400">Participants can see your entire screen</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="size-28 border-4 border-cyan-500/30 shadow-2xl">
                <AvatarImage src={peerAvatarUrl || undefined} alt={title} />
                <AvatarFallback className="text-3xl font-bold bg-slate-800 text-cyan-400">
                  {getInitials(title)}
                </AvatarFallback>
              </Avatar>
              <p className="text-lg font-bold text-slate-100">{title}</p>
              <p className="text-xs text-emerald-400 font-mono">00:42 · Connected</p>
            </div>
          )}
        </div>

        {/* Call Controls Bar */}
        <div className="border-t border-slate-800 bg-slate-900 p-4 flex items-center justify-center gap-4">
          {/* Mic Mute Toggle */}
          <Button
            size="icon"
            variant={muted ? "destructive" : "secondary"}
            onClick={() => {
              setMuted(!muted);
              toast.info(muted ? "Microphone unmuted" : "Microphone muted");
            }}
            className="size-12 rounded-full shadow-lg"
          >
            {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </Button>

          {/* Video Toggle */}
          {mode === "video" && (
            <Button
              size="icon"
              variant={videoOff ? "destructive" : "secondary"}
              onClick={() => {
                setVideoOff(!videoOff);
                toast.info(videoOff ? "Camera turned on" : "Camera turned off");
              }}
              className="size-12 rounded-full shadow-lg"
            >
              {videoOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
            </Button>
          )}

          {/* Screen Share Toggle */}
          <Button
            size="icon"
            variant={screenSharing ? "default" : "secondary"}
            onClick={toggleScreenShare}
            className={`size-12 rounded-full shadow-lg ${
              screenSharing ? "bg-cyan-500 text-slate-950 font-bold" : ""
            }`}
          >
            <ScreenShare className="size-5" />
          </Button>

          {/* End Call Button */}
          <Button
            size="icon"
            variant="destructive"
            onClick={handleEndCall}
            className="size-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/30"
          >
            <PhoneOff className="size-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
