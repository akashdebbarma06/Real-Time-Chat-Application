"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Download,
  FileIcon,
  ImageIcon,
  Loader2,
  LogOut,
  Search,
  Shield,
  User,
  UsersRound,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmActionDialog } from "@/components/chat/confirm-action-dialog";
import { createClient } from "@/lib/supabase/client";
import { formatConversationTime, formatFileSize, getInitials } from "@/lib/utils";
import type { ConversationSummary, Profile } from "@/types/chat";

interface SharedMediaItem {
  id: string;
  message_type: "text" | "image" | "file";
  attachment_path: string;
  attachment_name: string;
  attachment_size: number | null;
  created_at: string;
  url?: string;
}

export interface InPanelGroupInfoProps {
  conversation: ConversationSummary;
  currentUserId: string;
  onlineUserIds: Set<string>;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onSelectMember?: (profile: Profile) => void;
  onConversationActivity?: () => void;
  onBack: () => void;
}

export function InPanelGroupInfo({
  conversation,
  currentUserId,
  onlineUserIds,
  isMuted = false,
  onToggleMute,
  onSelectMember,
  onConversationActivity,
  onBack,
}: InPanelGroupInfoProps) {
  const router = useRouter();
  const [memberQuery, setMemberQuery] = useState("");
  const [sharedMedia, setSharedMedia] = useState<SharedMediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Fetch real group attachments
  useEffect(() => {
    if (!conversation.id) return;

    setLoadingMedia(true);
    void createClient()
      .from("messages")
      .select("id, message_type, attachment_path, attachment_name, attachment_size, created_at")
      .eq("conversation_id", conversation.id)
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
            return {
              ...row,
              url,
            } as SharedMediaItem;
          })
        );

        setSharedMedia(itemsWithUrls);
        setLoadingMedia(false);
      });
  }, [conversation.id]);

  const images = sharedMedia.filter(
    (item) => item.message_type === "image" || (item.url && item.attachment_name?.match(/\.(jpeg|jpg|gif|png|webp)$/i))
  );
  const files = sharedMedia.filter(
    (item) => item.message_type === "file" || (item.url && !item.attachment_name?.match(/\.(jpeg|jpg|gif|png|webp)$/i))
  );

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return conversation.members;
    return conversation.members.filter(
      (m) =>
        m.profile.display_name.toLowerCase().includes(q) ||
        m.profile.username.toLowerCase().includes(q)
    );
  }, [conversation.members, memberQuery]);

  async function handleLeaveGroup() {
    setLeaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("conversation_members")
        .delete()
        .eq("conversation_id", conversation.id)
        .eq("user_id", currentUserId);

      if (error) throw error;

      toast.success(`You left "${conversation.name || "the group"}"`);
      setConfirmLeaveOpen(false);
      onConversationActivity?.();
      router.push("/chat");
    } catch {
      toast.error("Failed to leave group");
    } finally {
      setLeaving(false);
    }
  }

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none border-r">
        {/* Sticky Top Header */}
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
            <h3 className="text-sm font-semibold text-foreground truncate">Group Info</h3>
            <p className="text-[11px] text-muted-foreground truncate">
              {conversation.members.length} {conversation.members.length === 1 ? "participant" : "participants"}
            </p>
          </div>
        </div>

        {/* Smooth Scrollable Container */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-5">
          {/* 1. Group DP & Title */}
          <div className="flex flex-col items-center text-center">
            <div className="relative size-20">
              <Avatar className="size-20 rounded-3xl border-2 border-primary/30 shadow-xl">
                <AvatarImage src={conversation.avatar_url || undefined} alt={conversation.name || "Group"} />
                <AvatarFallback className="rounded-3xl text-xl font-bold bg-primary/10 text-primary">
                  {getInitials(conversation.name || "Group Chat")}
                </AvatarFallback>
              </Avatar>
            </div>

            <h2 className="mt-3 text-lg font-bold tracking-tight text-foreground truncate max-w-full">
              {conversation.name || "Untitled Group"}
            </h2>

            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <UsersRound className="size-3.5 text-primary" />
              <span>
                {conversation.members.length} {conversation.members.length === 1 ? "member" : "members"}
              </span>
              <span>·</span>
              <span>Active Group</span>
            </div>
          </div>

          {/* 2. Participants Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UsersRound className="size-3 text-primary" />
                <span>Participants ({conversation.members.length})</span>
              </p>
            </div>

            {/* Search Input for Members */}
            {conversation.members.length > 5 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <Input
                  placeholder="Filter participants..."
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  className="h-8 pl-7 rounded-xl text-xs bg-muted/30"
                />
              </div>
            )}

            {/* Members List */}
            <div className="space-y-1">
              {filteredMembers.map((member) => {
                const isOnline = onlineUserIds.has(member.user_id);
                const isSelf = member.user_id === currentUserId;
                const isCreator = member.role === "admin" || member.role === "owner";

                return (
                  <button
                    key={member.user_id}
                    type="button"
                    onClick={() => {
                      if (!isSelf && onSelectMember) {
                        onSelectMember(member.profile);
                      }
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition ${
                      !isSelf ? "hover:bg-muted/60 cursor-pointer" : "opacity-90 cursor-default"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="size-8 rounded-full border">
                        <AvatarImage src={member.profile.avatar_url || undefined} alt={member.profile.display_name} />
                        <AvatarFallback className="rounded-full text-[10px] font-bold">
                          {getInitials(member.profile.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 size-2 rounded-full border-2 border-background bg-emerald-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {member.profile.display_name}
                        </p>
                        {isSelf && (
                          <span className="text-[10px] text-muted-foreground">(You)</span>
                        )}
                      </div>
                      <p className="truncate text-[10px] text-muted-foreground">
                        @{member.profile.username}
                      </p>
                    </div>

                    {isCreator && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-semibold text-primary shrink-0">
                        <Shield className="size-2.5" />
                        <span>Owner</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Shared Photos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="size-3 text-primary" />
                <span>Shared Photos</span>
              </p>
              <span className="text-[11px] text-muted-foreground font-medium">
                {images.length} {images.length === 1 ? "photo" : "photos"}
              </span>
            </div>

            {loadingMedia ? (
              <div className="flex h-16 items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>Loading media...</span>
              </div>
            ) : images.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
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
                        <ImageIcon className="size-4" />
                      </div>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/20 p-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">No photos shared in this group yet</p>
              </div>
            )}
          </div>

          {/* 4. Shared Files */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileIcon className="size-3 text-primary" />
                <span>Shared Files</span>
              </p>
              <span className="text-[11px] text-muted-foreground font-medium">
                {files.length} {files.length === 1 ? "file" : "files"}
              </span>
            </div>

            {loadingMedia ? (
              <div className="flex h-12 items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" />
              </div>
            ) : files.length > 0 ? (
              <div className="space-y-1.5">
                {files.map((file) => (
                  <a
                    key={file.id}
                    href={file.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={file.attachment_name}
                    className="flex items-center gap-2.5 rounded-xl border bg-muted/30 p-2 transition hover:bg-muted"
                  >
                    <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <FileIcon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {file.attachment_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatFileSize(file.attachment_size)} · {formatConversationTime(file.created_at)}
                      </p>
                    </div>
                    <Download className="size-3.5 text-muted-foreground shrink-0 hover:text-foreground" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/20 p-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">No documents shared in this group yet</p>
              </div>
            )}
          </div>

          {/* 5. Group Actions */}
          <div className="space-y-2 pt-2 border-t">
            {/* Mute Notifications */}
            <button
              type="button"
              onClick={() => {
                if (onToggleMute) onToggleMute();
                toast.success(isMuted ? "Group unmuted" : "Group muted");
              }}
              className="flex w-full items-center gap-2.5 rounded-xl border bg-muted/30 p-2.5 text-left transition hover:bg-muted cursor-pointer"
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
                <p className="text-[10px] text-muted-foreground truncate">
                  {isMuted ? "Receive notifications from this group" : "Silence notifications from this group"}
                </p>
              </div>
            </button>

            {/* Leave Group */}
            <button
              type="button"
              onClick={() => setConfirmLeaveOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-left text-destructive transition hover:bg-destructive/20 cursor-pointer"
            >
              <LogOut className="size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">Exit Group</p>
                <p className="text-[10px] opacity-80 truncate">Leave this group conversation</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <ConfirmActionDialog
        open={confirmLeaveOpen}
        onOpenChange={setConfirmLeaveOpen}
        title="Leave Group"
        description={`Are you sure you want to leave "${conversation.name || "this group"}"? You will not be able to send or receive messages in this group unless re-added.`}
        confirmLabel="Leave Group"
        variant="destructive"
        loading={leaving}
        onConfirm={() => void handleLeaveGroup()}
      />
    </>
  );
}
