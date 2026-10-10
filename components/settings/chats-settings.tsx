"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  ArrowLeft,
  CornerDownLeft,
  Download,
  FileText,
  HardDrive,
  Headphones,
  ImageIcon,
  Video,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export interface ChatsSettingsProps {
  onBack: () => void;
}

export function ChatsSettings({ onBack }: ChatsSettingsProps) {
  // Enter is send
  const [enterIsSend, setEnterIsSend] = useState(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("chat_enter_is_send");
      if (v !== null) return v === "true";
    }
    return true;
  });

  // Keep chats archived
  const [keepArchived, setKeepArchived] = useState(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("chat_keep_archived");
      if (v !== null) return v === "true";
    }
    return true;
  });

  // Media auto-download toggles
  const [autoDownloadPhotos, setAutoDownloadPhotos] = useState(true);
  const [autoDownloadAudio, setAutoDownloadAudio] = useState(true);
  const [autoDownloadVideos, setAutoDownloadVideos] = useState(false);
  const [autoDownloadDocs, setAutoDownloadDocs] = useState(true);

  function handleToggleEnterIsSend(val: boolean) {
    setEnterIsSend(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("chat_enter_is_send", String(val));
    }
    toast.success(val ? "Enter will send messages" : "Enter will create a new line");
  }

  function handleToggleKeepArchived(val: boolean) {
    setKeepArchived(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("chat_keep_archived", String(val));
    }
    toast.success(
      val
        ? "Archived chats will stay archived on new messages"
        : "Archived chats will unarchive on new messages"
    );
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
      {/* Top Header */}
      <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          className="rounded-xl size-8 shrink-0 hover:bg-muted"
          aria-label="Back to settings"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">Chats</h3>
          <p className="text-[11px] text-muted-foreground truncate">
            Keyboard, archives & media download
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-5 pb-28 md:pb-6">
        {/* Section 1: Keyboard & Input */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
            Key Behavior
          </p>
          <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
            {/* Enter is send */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
                  <CornerDownLeft className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-foreground block">
                    Enter is send
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5 leading-snug">
                    Pressing Enter sends your message. Use Shift + Enter for a new line.
                  </span>
                </div>
              </div>
              <Switch
                checked={enterIsSend}
                onCheckedChange={handleToggleEnterIsSend}
                aria-label="Toggle enter is send"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Archive Behavior */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
            Archived Chats
          </p>
          <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
            {/* Keep chats archived */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
                  <Archive className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-foreground block">
                    Keep chats archived
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5 leading-snug">
                    Archived chats remain hidden when you receive a new message.
                  </span>
                </div>
              </div>
              <Switch
                checked={keepArchived}
                onCheckedChange={handleToggleKeepArchived}
                aria-label="Toggle keep chats archived"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Media Auto-Download */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
            Media Auto-Download
          </p>
          <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
            {/* Photos */}
            <div className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="size-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-foreground">Photos</span>
              </div>
              <Switch
                checked={autoDownloadPhotos}
                onCheckedChange={(val) => {
                  setAutoDownloadPhotos(val);
                  toast.success(val ? "Photo auto-download on" : "Photo auto-download off");
                }}
              />
            </div>

            {/* Audio */}
            <div className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Headphones className="size-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-foreground">Audio & Voice notes</span>
              </div>
              <Switch
                checked={autoDownloadAudio}
                onCheckedChange={(val) => {
                  setAutoDownloadAudio(val);
                  toast.success(val ? "Audio auto-download on" : "Audio auto-download off");
                }}
              />
            </div>

            {/* Videos */}
            <div className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Video className="size-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-foreground">Videos</span>
              </div>
              <Switch
                checked={autoDownloadVideos}
                onCheckedChange={(val) => {
                  setAutoDownloadVideos(val);
                  toast.success(val ? "Video auto-download on" : "Video auto-download off");
                }}
              />
            </div>

            {/* Documents */}
            <div className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileText className="size-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-foreground">Documents</span>
              </div>
              <Switch
                checked={autoDownloadDocs}
                onCheckedChange={(val) => {
                  setAutoDownloadDocs(val);
                  toast.success(val ? "Document auto-download on" : "Document auto-download off");
                }}
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground px-1">
            Voice messages are always automatically downloaded for the best experience.
          </p>
        </div>
      </div>
    </div>
  );
}
