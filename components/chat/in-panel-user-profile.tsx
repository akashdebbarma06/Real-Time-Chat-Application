"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Bell,
  BellOff,
  ChevronRight,
  ImageIcon,
  Loader2,
  Phone,
  Play,
  Trash2,
  UserCheck,
  UserX,
  Video,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/chat/confirm-action-dialog";
import { SharedVaultView } from "@/components/chat/shared-vault-view";
import { createClient } from "@/lib/supabase/client";
import { formatConversationTime, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface SharedMediaItem {
  id: string;
  message_type: "text" | "image" | "file" | "video";
  attachment_path: string;
  attachment_name: string;
  attachment_size: number | null;
  created_at: string;
  url?: string;
  isVideo?: boolean;
}

export interface InPanelUserProfileProps {
  peerProfile: Profile;
  currentUserId: string;
  conversationId?: string;
  isOnline?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onBack: () => void;
}

export function InPanelUserProfile({
  peerProfile,
  currentUserId,
  conversationId,
  isOnline = false,
  isMuted = false,
  onToggleMute,
  onBack,
}: InPanelUserProfileProps) {
  const [sharedMedia, setSharedMedia] = useState<SharedMediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(Boolean(conversationId));
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [viewingVault, setViewingVault] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Sync state when conversationId changes
  const [prevConvId, setPrevConvId] = useState(conversationId);
  if (prevConvId !== conversationId) {
    setPrevConvId(conversationId);
    if (!conversationId) {
      setSharedMedia([]);
    }
  }

  // Fetch real shared media & block status
  useEffect(() => {
    if (!peerProfile) return;

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
                url = signData?.signedUrl;
              }
              const isVideo =
                (row.message_type as string) === "video" ||
                Boolean(row.attachment_name?.match(/\.(mp4|webm|mov|mkv)$/i));

              return {
                ...row,
                url,
                isVideo,
              } as SharedMediaItem;
            })
          );

          setSharedMedia(itemsWithUrls);
          setLoadingMedia(false);
        });
    }
  }, [peerProfile, currentUserId, conversationId]);

  async function handleToggleBlock() {
    if (!currentUserId || !peerProfile?.id) return;
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
        const { error } = await supabase
          .from("blocked_users")
          .insert({
            blocker_id: currentUserId,
            blocked_id: peerProfile.id,
          });

        if (error) throw error;
        setIsBlocked(true);
        toast.success(`Blocked ${peerProfile.display_name}`);
      }
    } catch {
      toast.error(isBlocked ? "Failed to unblock user" : "Failed to block user");
    } finally {
      setBlockLoading(false);
    }
  }

  async function handleClearConversation() {
    if (!conversationId) return;
    setClearing(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("conversation_id", conversationId);

      if (error) throw error;
      setSharedMedia([]);
      toast.success("Conversation cleared");
      setConfirmClearOpen(false);
    } catch {
      toast.error("Failed to clear conversation");
    } finally {
      setClearing(false);
    }
  }

  // Filter media for photos and videos only
  const mediaList = useMemo(() => {
    return sharedMedia.filter((item) => {
      const isImg =
        item.message_type === "image" ||
        Boolean(item.attachment_name?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i));
      const isVid =
        item.message_type === "video" ||
        Boolean(item.attachment_name?.match(/\.(mp4|webm|mov|mkv)$/i));
      return isImg || isVid;
    });
  }, [sharedMedia]);

  // Only 3 recent photo and video items visible on info panel
  const recentMedia = useMemo(() => mediaList.slice(0, 3), [mediaList]);

  // If viewing the full shared vault, render the SharedVaultView sub-panel
  if (viewingVault) {
    return (
      <SharedVaultView
        conversationId={conversationId}
        title={peerProfile.display_name}
        onBack={() => setViewingVault(false)}
      />
    );
  }

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none border-r border-border">
        {/* Sticky Header */}
        <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            className="rounded-xl size-8 shrink-0 hover:bg-muted"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Contact Info</h3>
            <p className="text-[11px] text-muted-foreground truncate">@{peerProfile.username}</p>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {/* 1. Compact Horizontal Hero Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/70 bg-card/60 shadow-xs">
            <div className="relative shrink-0">
              <Avatar className="size-12 rounded-full border border-border">
                <AvatarImage src={peerProfile.avatar_url || undefined} alt={peerProfile.display_name} />
                <AvatarFallback className="text-sm font-bold bg-muted text-foreground">
                  {getInitials(peerProfile.display_name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute bottom-0 right-0 size-3 rounded-full border-2 border-background",
                  isOnline ? "bg-emerald-500" : "bg-muted-foreground/60"
                )}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-foreground truncate leading-tight">
                {peerProfile.display_name}
              </h2>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                @{peerProfile.username}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={cn(
                    "size-1.5 rounded-full shrink-0",
                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/60"
                  )}
                />
                <span className="text-[11px] text-muted-foreground truncate">
                  {isOnline
                    ? "Active now"
                    : peerProfile.last_seen_at
                      ? `Last seen ${formatConversationTime(peerProfile.last_seen_at)}`
                      : "Offline"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Action Row: 2-column grid button pair */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => toast.info(`Starting audio call with ${peerProfile.display_name}...`)}
              className="h-9 rounded-xl border-border/70 bg-card/50 hover:bg-muted text-xs font-medium gap-2 text-foreground"
            >
              <Phone className="size-3.5 text-primary" />
              <span>Audio Call</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.info(`Starting video call with ${peerProfile.display_name}...`)}
              className="h-9 rounded-xl border-border/70 bg-card/50 hover:bg-muted text-xs font-medium gap-2 text-foreground"
            >
              <Video className="size-3.5 text-primary" />
              <span>Video Call</span>
            </Button>
          </div>

          {/* 3. Bio Section: Clean rounded box */}
          <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-1 shadow-xs">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Bio
            </span>
            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {peerProfile.bio?.trim() || "No bio provided yet."}
            </p>
          </div>

          {/* 4. Shared Vault: 3 recent photo/video preview with View All button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="size-3.5 text-primary" />
                <span>Shared Vault</span>
              </span>
              <button
                type="button"
                onClick={() => setViewingVault(true)}
                className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>View all</span>
                <ChevronRight className="size-3" />
              </button>
            </div>

            {/* Content: Only 3 recent photos & videos */}
            {loadingMedia ? (
              <div className="flex h-20 items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>Loading media...</span>
              </div>
            ) : recentMedia.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {recentMedia.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setViewingVault(true)}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border/70 bg-muted/40 transition hover:opacity-90 cursor-pointer text-left"
                  >
                    {item.isVideo ? (
                      <div className="relative size-full bg-black/80 flex items-center justify-center">
                        {item.url ? (
                          <video
                            src={item.url}
                            preload="metadata"
                            className="size-full object-cover opacity-80"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:scale-110 transition">
                          <div className="size-6 rounded-full bg-black/60 flex items-center justify-center text-white">
                            <Play className="size-3 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : item.url ? (
                      <Image
                        src={item.url}
                        alt={item.attachment_name || "Shared photo"}
                        fill
                        unoptimized
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-xs text-muted-foreground">
                        <ImageIcon className="size-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border/70 bg-card/40 p-4 text-center">
                <p className="text-xs text-muted-foreground">No photos or videos shared yet</p>
              </div>
            )}
          </div>

          {/* 5. Actions: Grouped list card */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
              Privacy & Controls
            </span>
            <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
              {/* Mute Notifications */}
              <button
                type="button"
                onClick={() => {
                  if (onToggleMute) onToggleMute();
                  toast.success(isMuted ? "Notifications unmuted" : "Notifications muted");
                }}
                className="flex items-center justify-between w-full p-3 hover:bg-muted/60 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {isMuted ? (
                    <Bell className="size-4 text-primary shrink-0" />
                  ) : (
                    <BellOff className="size-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs font-medium text-foreground">
                    {isMuted ? "Unmute Notifications" : "Mute Notifications"}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {isMuted ? "Muted" : "Active"}
                </span>
              </button>

              {/* Clear Conversation */}
              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                className="flex items-center justify-between w-full p-3 hover:bg-muted/60 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium text-foreground">Clear conversation</span>
                </div>
              </button>

              {/* Block Contact: muted red button */}
              <button
                type="button"
                disabled={blockLoading}
                onClick={() => void handleToggleBlock()}
                className="flex items-center justify-between w-full p-3 hover:bg-destructive/10 text-destructive/90 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {blockLoading ? (
                    <Loader2 className="size-4 animate-spin shrink-0" />
                  ) : isBlocked ? (
                    <UserCheck className="size-4 shrink-0" />
                  ) : (
                    <UserX className="size-4 shrink-0" />
                  )}
                  <span className="text-xs font-medium">
                    {isBlocked ? "Unblock contact" : "Block contact"}
                  </span>
                </div>
                <span className="text-[11px] opacity-70">
                  {isBlocked ? "Blocked" : ""}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmActionDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title="Clear Conversation"
        description="Are you sure you want to clear all messages in this conversation? This cannot be undone."
        confirmLabel="Clear"
        variant="destructive"
        loading={clearing}
        onConfirm={() => void handleClearConversation()}
      />
    </>
  );
}
