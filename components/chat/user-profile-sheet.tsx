"use client";

import Image from "next/image";
import {
  Bell,
  BellOff,
  FileIcon,
  Globe,
  ImageIcon,
  ShieldAlert,
  UserX,
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
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden rounded-3xl shadow-2xl">
        <DialogHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-bold">User Info</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] p-5">
          <div className="space-y-6">
            {/* 1. Avatar & Online Status */}
            <div className="flex flex-col items-center text-center">
              <div className="relative size-24">
                <Avatar className="size-24 rounded-full border-2 border-cyan-500/40 shadow-xl">
                  <AvatarImage src={peerProfile.avatar_url || undefined} alt={peerProfile.display_name} />
                  <AvatarFallback className="rounded-full text-2xl font-bold bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400">
                    {getInitials(peerProfile.display_name)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-1 right-1 size-4 rounded-full border-2 border-slate-900 ${
                    isOnline ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-slate-400"
                  }`}
                />
              </div>

              <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-100">{peerProfile.display_name}</h2>
              <p className="text-xs text-slate-400 font-mono">@{peerProfile.username}</p>

              {/* Status Badge */}
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-950 border border-slate-800 px-3 py-1 text-xs font-semibold">
                <span className={`size-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                <span className={isOnline ? "text-emerald-400" : "text-slate-400"}>
                  {isOnline ? "Online" : `Last seen ${new Date(peerProfile.last_seen_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                </span>
              </div>
            </div>

            {/* 2. Bio */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bio</p>
              <p className="text-sm text-slate-200 leading-relaxed">
                {peerProfile.bio || "No bio provided yet."}
              </p>
            </div>

            {/* 3. Shared Media */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-cyan-400" />
                  <span>Shared Media</span>
                </p>
                <span className="text-xs text-slate-500">2 files</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                  <div className="grid size-full place-items-center bg-cyan-500/10 text-cyan-400 text-xs font-medium">
                    Photo 1
                  </div>
                </div>
                <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                  <div className="grid size-full place-items-center bg-blue-500/10 text-blue-400 text-xs font-medium">
                    Photo 2
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Shared Files */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileIcon className="size-3.5 text-cyan-400" />
                  <span>Shared Files</span>
                </p>
                <span className="text-xs text-slate-500">1 file</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                <div className="grid size-9 place-items-center rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                  <FileIcon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-200">project_document.pdf</p>
                  <p className="text-[10px] text-slate-500">1.8 MB · 2 days ago</p>
                </div>
              </div>
            </div>

            {/* 5. Actions: Mute, Block, Report */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  if (onToggleMute) onToggleMute();
                  toast.success(isMuted ? "Notifications unmuted" : "Notifications muted");
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-left transition hover:bg-slate-800"
              >
                {isMuted ? <Bell className="size-4 text-emerald-400" /> : <BellOff className="size-4 text-amber-400" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200">{isMuted ? "Unmute Notifications" : "Mute Notifications"}</p>
                  <p className="text-[10px] text-slate-400">Silence alerts from this contact</p>
                </div>
              </button>

              <button
                onClick={() => toast.error(`Blocked ${peerProfile.display_name}`)}
                className="flex w-full items-center gap-3 rounded-xl border border-rose-950/40 bg-rose-950/20 p-3 text-left transition hover:bg-rose-950/40"
              >
                <UserX className="size-4 text-rose-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-rose-400">Block Contact</p>
                  <p className="text-[10px] text-slate-400">Prevent messages & calls from this user</p>
                </div>
              </button>

              <button
                onClick={() => toast.info("Report submitted to support")}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-left transition hover:bg-slate-800"
              >
                <ShieldAlert className="size-4 text-amber-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200">Report Contact</p>
                  <p className="text-[10px] text-slate-400">Report spam or abusive behavior</p>
                </div>
              </button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
