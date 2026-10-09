"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
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
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface GroupInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: ConversationSummary;
  currentUserId: string;
  onlineUserIds: Set<string>;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onSelectMember?: (profile: Profile) => void;
  onConversationActivity?: () => void;
}

export function GroupInfoSheet({
  open,
  onOpenChange,
  conversation,
  currentUserId,
  onlineUserIds,
  isMuted = false,
  onToggleMute,
  onSelectMember,
  onConversationActivity,
}: GroupInfoSheetProps) {
  const router = useRouter();
  const [memberQuery, setMemberQuery] = useState("");
  const [sharedMedia, setSharedMedia] = useState<SharedMediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Fetch real group attachments
  useEffect(() => {
    if (!open || !conversation.id) return;

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
  }, [open, conversation.id]);

  const images = sharedMedia.filter((item) => item.message_type === "image");
  const files = sharedMedia.filter((item) => item.message_type !== "image");

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
      onOpenChange(false);
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md w-full max-h-[88vh] h-[88vh] p-0 flex flex-col rounded-3xl overflow-hidden shadow-2xl border bg-background">
          <DialogHeader className="p-4 border-b flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="text-base font-bold">Group Info</DialogTitle>
          </DialogHeader>

          {/* Scrollable Container with Reliable Overflow */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6">
            {/* 1. Group DP & Title */}
            <div className="flex flex-col items-center text-center">
              <div className="relative size-24">
                <Avatar className="size-24 rounded-3xl border-2 border-purple-500/30 shadow-xl">
                  <AvatarImage src={conversation.avatar_url || undefined} alt={conversation.name || "Group"} />
                  <AvatarFallback className="rounded-3xl text-2xl font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    {getInitials(conversation.name || "Group Chat")}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground">
                {conversation.name || "Untitled Group"}
              </h2>

              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                <UsersRound className="size-3.5 text-purple-600 dark:text-purple-400" />
                <span>
                  {conversation.members.length} {conversation.members.length === 1 ? "member" : "members"}
                </span>
                <span>·</span>
                <span>Active Group</span>
              </div>
            </div>

            {/* 2. Members Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <UsersRound className="size-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Participants ({conversation.members.length})</span>
                </p>
              </div>

              {/* Search Member Filter */}
              {conversation.members.length > 5 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    placeholder="Search participants..."
                    className="h-8 pl-8 text-xs rounded-xl bg-muted/40 border-muted focus-visible:ring-purple-500/30"
                  />
                </div>
              )}

              {/* Members List */}
              <div className="rounded-2xl border bg-muted/20 divide-y divide-muted/40 overflow-hidden">
                {filteredMembers.map((member) => {
                  const isOnline = onlineUserIds.has(member.user_id);
                  const isSelf = member.user_id === currentUserId;
                  const isAdmin = member.role === "admin" || member.role === "owner";

                  return (
                    <div
                      key={member.user_id}
                      onClick={() => {
                        if (!isSelf && onSelectMember) {
                          onSelectMember(member.profile);
                        }
                      }}
                      className={`flex items-center gap-3 p-3 transition ${
                        isSelf
                          ? "bg-muted/10"
                          : "hover:bg-muted/50 cursor-pointer"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="size-9 border">
                          <AvatarImage src={member.profile.avatar_url || undefined} alt={member.profile.display_name} />
                          <AvatarFallback className="text-[10px] font-bold">
                            {getInitials(member.profile.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <span
                            aria-label="Online"
                            className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-emerald-500"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {member.profile.display_name}
                          </p>
                          {isSelf && (
                            <span className="text-[10px] font-medium text-muted-foreground">
                              (You)
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          @{member.profile.username}
                        </p>
                      </div>

                      {isAdmin && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                          <Shield className="size-2.5" />
                          <span>Admin</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Real Group Shared Photos */}
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
                  <p className="text-xs text-muted-foreground">No photos shared in this group yet</p>
                </div>
              )}
            </div>

            {/* 4. Real Group Shared Documents & Files */}
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
                  <p className="text-xs text-muted-foreground">No documents shared in this group yet</p>
                </div>
              )}
            </div>

            {/* 5. Group Actions */}
            <div className="space-y-2 pt-2 border-t">
              {/* Mute Group */}
              <button
                type="button"
                onClick={() => {
                  if (onToggleMute) onToggleMute();
                  toast.success(isMuted ? "Group unmuted" : "Group notifications muted");
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
                    {isMuted ? "Unmute Group" : "Mute Group Notifications"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isMuted ? "Alerts will ring for new messages" : "Silence notifications from this group"}
                  </p>
                </div>
              </button>

              {/* Leave Group */}
              <button
                type="button"
                onClick={() => setConfirmLeaveOpen(true)}
                className="flex w-full items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-left transition hover:bg-destructive/20 text-destructive cursor-pointer"
              >
                <LogOut className="size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">Leave Group</p>
                  <p className="text-[10px] opacity-80">
                    Exit this conversation and stop receiving group updates
                  </p>
                </div>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation modal before leaving group */}
      <ConfirmActionDialog
        open={confirmLeaveOpen}
        onOpenChange={setConfirmLeaveOpen}
        title={`Leave "${conversation.name || "Group"}"?`}
        description="Are you sure you want to leave this group? You will no longer be able to send or view new messages in this chat."
        confirmLabel="Leave Group"
        variant="destructive"
        loading={leaving}
        onConfirm={() => void handleLeaveGroup()}
      />
    </>
  );
}
