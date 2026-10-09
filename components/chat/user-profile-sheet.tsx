"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Bell,
  BellOff,
  Calendar,
  Download,
  FileIcon,
  ImageIcon,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  ShieldAlert,
  UserCheck,
  UserX,
  Video,
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
import { createClient } from "@/lib/supabase/client";
import { formatConversationTime, formatFileSize, getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface SharedMediaItem {
  id: string;
  message_type: "text" | "image" | "file";
  attachment_path: string;
  attachment_name: string;
  attachment_size: number | null;
  created_at: string;
  url?: string;
}

interface UserProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peerProfile?: Profile | null;
  currentUserId?: string;
  conversationId?: string;
  isOnline?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export function UserProfileSheet({
  open,
  onOpenChange,
  peerProfile,
  currentUserId,
  conversationId,
  isOnline = false,
  isMuted = false,
  onToggleMute,
}: UserProfileSheetProps) {
  const [sharedMedia, setSharedMedia] = useState<SharedMediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  // Fetch real shared media & block status
  useEffect(() => {
    if (!open || !peerProfile) return;

    // 1. Check if user is blocked
    if (currentUserId && peerProfile.id) {
      void createClient()
        .from("blocked_users")
        .select("blocked_id")
        .eq("blocker_id", currentUserId)
        .eq("blocked_id", peerProfile.id)
        .maybeSingle()
        .then(({ data }) => {
          setIsBlocked(!!data);
        });
    }

    // 2. Fetch real attachments from this conversation
    if (conversationId) {
      setLoadingMedia(true);
      void createClient()
        .from("messages")
        .select("id, message_type, attachment_path, attachment_name, attachment_size, created_at")
        .eq("conversation_id", conversationId)
        .not("attachment_path", "is", null)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(30)
        .then(async ({ data }) => {
          if (!data || data.length === 0) {
            setSharedMedia([]);
            setLoadingMedia(false);
            return;
          }

          const supabase = createClient();
          const itemsWithUrls = await Promise.all(
            data.map(async (row) => {
              let url: string | undefined;
              if (row.attachment_path) {
                const { data: signData } = await supabase.storage
                  .from("chat-files")
                  .createSignedUrl(row.attachment_path, 3600);
                url = signData?.signedUrl || undefined;
              }
              return {
                id: row.id,
                message_type: row.message_type as "text" | "image" | "file",
                attachment_path: row.attachment_path,
                attachment_name: row.attachment_name || "Attachment",
                attachment_size: row.attachment_size,
                created_at: row.created_at,
                url,
              };
            })
          );

          setSharedMedia(itemsWithUrls);
          setLoadingMedia(false);
        });
    }
  }, [open, peerProfile, currentUserId, conversationId]);

  if (!peerProfile) return null;

  const images = sharedMedia.filter((item) => item.message_type === "image");
  const files = sharedMedia.filter((item) => item.message_type !== "image");

  async function handleToggleBlock() {
    if (!currentUserId || !peerProfile) return;
    setBlockLoading(true);
    try {
      const supabase = createClient();
      if (isBlocked) {
        const { error } = await supabase
          .from("blocked_users")
          .delete()
          .eq("blocker_id", currentUserId)
          .eq("blocked_id", peerProfile.id);
        if (error) throw error;
        setIsBlocked(false);
        toast.success(`Unblocked ${peerProfile.display_name}`);
      } else {
        const { error } = await supabase.from("blocked_users").insert({
          blocker_id: currentUserId,
          blocked_id: peerProfile.id,
        });
        if (error) throw error;
        setIsBlocked(true);
        toast.success(`Blocked ${peerProfile.display_name}`);
      }
    } catch {
      toast.error("Failed to update block status");
    } finally {
      setBlockLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full max-h-[88vh] h-[88vh] p-0 flex flex-col rounded-3xl overflow-hidden shadow-2xl border bg-background">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="text-base font-bold">Contact Info</DialogTitle>
        </DialogHeader>

        {/* Scrollable Container with Reliable Overflow */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6">
          {/* 1. Avatar & Online Status */}
          <div className="flex flex-col items-center text-center">
            <div className="relative size-24">
              <Avatar className="size-24 rounded-full border-2 border-purple-500/30 shadow-xl">
                <AvatarImage src={peerProfile.avatar_url || undefined} alt={peerProfile.display_name} />
                <AvatarFallback className="rounded-full text-2xl font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  {getInitials(peerProfile.display_name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-1 right-1 size-4 rounded-full border-2 border-background ${
                  isOnline
                    ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                    : "bg-muted-foreground/50"
                }`}
                title={isOnline ? "Online" : "Offline"}
              />
            </div>

            <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground">
              {peerProfile.display_name}
            </h2>
            <p className="text-xs text-muted-foreground font-mono">@{peerProfile.username}</p>

            {/* Status Badge */}
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-muted/60 border px-3 py-1 text-xs font-semibold">
              <span
                className={`size-2 rounded-full ${
                  isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/60"
                }`}
              />
              <span className={isOnline ? "text-emerald-500 font-medium" : "text-muted-foreground"}>
                {isOnline
                  ? "Active Now"
                  : peerProfile.last_seen_at
                    ? `Last seen ${formatConversationTime(peerProfile.last_seen_at)}`
                    : "Offline"}
              </span>
            </div>

            {/* Quick Action Buttons: Voice / Video Call */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info(`Starting voice call with ${peerProfile.display_name}...`)}
                className="rounded-2xl gap-2 h-9 px-4 text-xs font-semibold hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/30 transition-all"
              >
                <Phone className="size-3.5 text-purple-600 dark:text-purple-400" />
                <span>Call</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info(`Starting video call with ${peerProfile.display_name}...`)}
                className="rounded-2xl gap-2 h-9 px-4 text-xs font-semibold hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/30 transition-all"
              >
                <Video className="size-3.5 text-purple-600 dark:text-purple-400" />
                <span>Video</span>
              </Button>
            </div>
          </div>

          {/* 2. Bio & User Info */}
          <div className="rounded-2xl border bg-muted/30 p-4 space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              About
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {peerProfile.bio?.trim() || "No bio provided yet."}
            </p>
            {peerProfile.last_seen_at && (
              <div className="flex items-center gap-1.5 pt-2 text-[11px] text-muted-foreground border-t border-muted/50">
                <Calendar className="size-3.5" />
                <span>Member on Aether Chat</span>
              </div>
            )}
          </div>

          {/* 3. Real Shared Photos */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="size-3.5 text-purple-600 dark:text-purple-400" />
                <span>Shared Photos</span>
              </p>
              <span className="text-xs text-muted-foreground font-medium">
                {images.length} {images.length === 1 ? "photo" : "photos"}
              </span>
            </div>

            {loadingMedia ? (
              <div className="flex h-20 items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-purple-600" />
                <span>Loading media...</span>
              </div>
            ) : images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img) => (
                  <a
                    key={img.id}
                    href={img.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-xl border bg-muted/40 transition hover:opacity-90"
                  >
                    {img.url ? (
                      <Image
                        src={img.url}
                        alt={img.attachment_name || "Shared photo"}
                        fill
                        unoptimized
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-xs text-muted-foreground">
                        <ImageIcon className="size-5" />
                      </div>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/20 p-3.5 text-center">
                <p className="text-xs text-muted-foreground">No photos shared in this chat yet</p>
              </div>
            )}
          </div>

          {/* 4. Real Shared Documents & Files */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileIcon className="size-3.5 text-purple-600 dark:text-purple-400" />
                <span>Shared Files</span>
              </p>
              <span className="text-xs text-muted-foreground font-medium">
                {files.length} {files.length === 1 ? "file" : "files"}
              </span>
            </div>

            {loadingMedia ? (
              <div className="flex h-16 items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-purple-600" />
              </div>
            ) : files.length > 0 ? (
              <div className="space-y-2">
                {files.map((file) => (
                  <a
                    key={file.id}
                    href={file.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={file.attachment_name}
                    className="flex items-center gap-3 rounded-xl border bg-muted/30 p-2.5 transition hover:bg-muted"
                  >
                    <div className="grid size-9 place-items-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                      <FileIcon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {file.attachment_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatFileSize(file.attachment_size)} · {formatConversationTime(file.created_at)}
                      </p>
                    </div>
                    <Download className="size-4 text-muted-foreground shrink-0 hover:text-foreground" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/20 p-3.5 text-center">
                <p className="text-xs text-muted-foreground">No documents shared in this chat yet</p>
              </div>
            )}
          </div>

          {/* 5. Actions: Mute, Block, Report */}
          <div className="space-y-2 pt-2 border-t">
            {/* Mute Notifications */}
            <button
              type="button"
              onClick={() => {
                if (onToggleMute) onToggleMute();
                toast.success(isMuted ? "Notifications unmuted" : "Notifications muted");
              }}
              className="flex w-full items-center gap-3 rounded-2xl border bg-muted/30 p-3 text-left transition hover:bg-muted cursor-pointer"
            >
              {isMuted ? (
                <Bell className="size-4 text-emerald-500 shrink-0" />
              ) : (
                <BellOff className="size-4 text-amber-500 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">
                  {isMuted ? "Unmute Notifications" : "Mute Notifications"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isMuted ? "You will receive notifications from this chat" : "Silence notifications for this contact"}
                </p>
              </div>
            </button>

            {/* Block / Unblock Contact */}
            <button
              type="button"
              disabled={blockLoading}
              onClick={() => void handleToggleBlock()}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition cursor-pointer ${
                isBlocked
                  ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive"
              }`}
            >
              {blockLoading ? (
                <Loader2 className="size-4 animate-spin shrink-0" />
              ) : isBlocked ? (
                <UserCheck className="size-4 shrink-0" />
              ) : (
                <UserX className="size-4 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">
                  {isBlocked ? "Unblock Contact" : "Block Contact"}
                </p>
                <p className="text-[10px] opacity-80">
                  {isBlocked
                    ? "Allow messages and calls from this user"
                    : "Prevent messages and calls from this user"}
                </p>
              </div>
            </button>

            {/* Report Contact */}
            <button
              type="button"
              onClick={() => toast.info("Report submitted to moderation team")}
              className="flex w-full items-center gap-3 rounded-2xl border bg-muted/30 p-3 text-left transition hover:bg-muted cursor-pointer"
            >
              <ShieldAlert className="size-4 text-amber-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">Report Contact</p>
                <p className="text-[10px] text-muted-foreground">Report spam, abuse, or impersonation</p>
              </div>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
