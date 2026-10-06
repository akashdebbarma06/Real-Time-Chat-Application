"use client";

import {
  Bell,
  BellOff,
  FileIcon,
  ImageIcon,
  ShieldAlert,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface UserProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peerProfile?: Profile | null;
  isOnline?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export function UserProfileSheet({
  open,
  onOpenChange,
  peerProfile,
  isOnline = false,
  isMuted = false,
  onToggleMute,
}: UserProfileSheetProps) {
  if (!peerProfile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-h-none sm:h-auto sm:max-w-md p-0 overflow-hidden rounded-none sm:rounded-3xl shadow-2xl flex flex-col">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-bold">User Info</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] p-5">
          <div className="space-y-6">
            {/* 1. Avatar & Online Status */}
            <div className="flex flex-col items-center text-center">
              <div className="relative size-24">
                <Avatar className="size-24 rounded-full border-2 border-primary/30 shadow-xl">
                  <AvatarImage src={peerProfile.avatar_url || undefined} alt={peerProfile.display_name} />
                  <AvatarFallback className="rounded-full text-2xl font-bold bg-primary/10 text-primary">
                    {getInitials(peerProfile.display_name)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-1 right-1 size-4 rounded-full border-2 border-background ${
                    isOnline ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-muted-foreground/50"
                  }`}
                />
              </div>

              <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground">{peerProfile.display_name}</h2>
              <p className="text-xs text-muted-foreground font-mono">@{peerProfile.username}</p>

              {/* Status Badge */}
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted/60 border px-3 py-1 text-xs font-semibold">
                <span className={`size-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/60"}`} />
                <span className={isOnline ? "text-emerald-500 font-medium" : "text-muted-foreground"}>
                  {isOnline ? "Online" : `Last seen ${new Date(peerProfile.last_seen_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                </span>
              </div>
            </div>

            {/* 2. Bio */}
            <div className="rounded-2xl border bg-muted/30 p-4 space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bio</p>
              <p className="text-sm text-foreground leading-relaxed">
                {peerProfile.bio || "No bio provided yet."}
              </p>
            </div>

            {/* 3. Shared Media */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-primary" />
                  <span>Shared Media</span>
                </p>
                <span className="text-xs text-muted-foreground">2 files</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted/40">
                  <div className="grid size-full place-items-center bg-primary/10 text-primary text-xs font-medium">
                    Photo 1
                  </div>
                </div>
                <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted/40">
                  <div className="grid size-full place-items-center bg-primary/10 text-primary text-xs font-medium">
                    Photo 2
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Shared Files */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileIcon className="size-3.5 text-primary" />
                  <span>Shared Files</span>
                </p>
                <span className="text-xs text-muted-foreground">1 file</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-2.5">
                <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <FileIcon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">project_document.pdf</p>
                  <p className="text-[10px] text-muted-foreground">1.8 MB · 2 days ago</p>
                </div>
              </div>
            </div>

            {/* 5. Actions: Mute, Block, Report */}
            <div className="space-y-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  if (onToggleMute) onToggleMute();
                  toast.success(isMuted ? "Notifications unmuted" : "Notifications muted");
                }}
                className="flex w-full items-center gap-3 rounded-xl border bg-muted/30 p-3 text-left transition hover:bg-muted"
              >
                {isMuted ? <Bell className="size-4 text-emerald-500" /> : <BellOff className="size-4 text-amber-500" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground">{isMuted ? "Unmute Notifications" : "Mute Notifications"}</p>
                  <p className="text-[10px] text-muted-foreground">Silence alerts from this contact</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toast.error(`Blocked ${peerProfile.display_name}`)}
                className="flex w-full items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-left transition hover:bg-destructive/20"
              >
                <UserX className="size-4 text-destructive" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-destructive">Block Contact</p>
                  <p className="text-[10px] text-muted-foreground">Prevent messages & calls from this user</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toast.info("Report submitted to support")}
                className="flex w-full items-center gap-3 rounded-xl border bg-muted/30 p-3 text-left transition hover:bg-muted"
              >
                <ShieldAlert className="size-4 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground">Report Contact</p>
                  <p className="text-[10px] text-muted-foreground">Report spam or abusive behavior</p>
                </div>
              </button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
