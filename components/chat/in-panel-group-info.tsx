"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Camera,
  Check,
  ChevronRight,
  ImageIcon,
  Loader2,
  LogOut,
  Pencil,
  Play,
  Plus,
  Search,
  Shield,
  Sliders,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmActionDialog } from "@/components/chat/confirm-action-dialog";
import { GroupPermissionsView } from "@/components/chat/group-permissions-view";
import { SharedVaultView } from "@/components/chat/shared-vault-view";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials } from "@/lib/utils";
import { useBackHandler } from "@/hooks/use-back-handler";
import type { ConversationSummary, Profile } from "@/types/chat";

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
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Sub-panel views
  const [viewingVault, setViewingVault] = useState(false);
  const [viewingPermissions, setViewingPermissions] = useState(false);

  // Priority 2a: Sub-view inside Group Info
  useBackHandler({
    id: "in-panel-group-subview",
    priority: 60,
    enabled: viewingPermissions || viewingVault,
    onBack: () => {
      if (viewingPermissions) setViewingPermissions(false);
      if (viewingVault) setViewingVault(false);
    },
  });

  // Inline editing: Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(conversation.avatar_url);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Inline editing: Group Name
  const [groupName, setGroupName] = useState(conversation.name || "Untitled Group");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(conversation.name || "Untitled Group");
  const [savingName, setSavingName] = useState(false);

  // Inline editing: Group Description
  const [groupDesc, setGroupDesc] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`group_desc_${conversation.id}`);
      if (saved) return saved;
    }
    return "Aether workspace for team collaboration, shared vaults, and group messaging.";
  });
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState(groupDesc);

  // Members and media
  const [memberQuery, setMemberQuery] = useState("");
  const [sharedMedia, setSharedMedia] = useState<SharedMediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(Boolean(conversation.id));

  // Danger actions dialog states
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Add Member Dialog states
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  // Sync props when conversation changes
  const [prevConvId, setPrevConvId] = useState(conversation.id);
  if (prevConvId !== conversation.id) {
    setPrevConvId(conversation.id);
    setGroupName(conversation.name || "Untitled Group");
    setNameInput(conversation.name || "Untitled Group");
    setAvatarUrl(conversation.avatar_url);
  }

  // Fetch real group attachments
  useEffect(() => {
    if (!conversation.id) return;

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
  }, [conversation.id]);

  // Fetch users when Add Member dialog opens
  useEffect(() => {
    if (!addMemberOpen) return;
    const existingMemberIds = new Set(conversation.members.map((m) => m.user_id));

    const timer = setTimeout(async () => {
      try {
        const supabase = createClient();
        let request = supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, bio, last_seen_at")
          .order("display_name")
          .limit(30);

        const safeQuery = addMemberSearch.trim().replace(/[,()]/g, "");
        if (safeQuery) {
          request = request.or(`display_name.ilike.%${safeQuery}%,username.ilike.%${safeQuery}%`);
        }

        const { data, error } = await request;
        if (!error && data) {
          setAvailableUsers((data as Profile[]).filter((p) => !existingMemberIds.has(p.id)));
        }
      } finally {
        setLoadingUsers(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [addMemberOpen, addMemberSearch, conversation.members]);

  // Handle Avatar Upload
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const path = `group-avatars/${conversation.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
      const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, file);

      let publicUrl: string;
      if (uploadError) {
        // Fallback to object URL if bucket write fails
        publicUrl = URL.createObjectURL(file);
      } else {
        const { data: signData } = await supabase.storage
          .from("chat-files")
          .createSignedUrl(path, 315360000);
        publicUrl = signData?.signedUrl || URL.createObjectURL(file);
      }

      const { error: dbError } = await supabase
        .from("conversations")
        .update({ avatar_url: publicUrl })
        .eq("id", conversation.id);

      if (dbError) throw dbError;

      setAvatarUrl(publicUrl);
      toast.success("Group photo updated");
      onConversationActivity?.();
    } catch {
      toast.error("Failed to upload group photo");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  // Handle Save Group Name
  async function handleSaveGroupName() {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      toast.error("Group name cannot be empty");
      return;
    }

    setSavingName(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("conversations")
        .update({ name: trimmed })
        .eq("id", conversation.id);

      if (error) throw error;

      setGroupName(trimmed);
      setIsEditingName(false);
      toast.success("Group name updated");
      onConversationActivity?.();
    } catch {
      toast.error("Failed to update group name");
    } finally {
      setSavingName(false);
    }
  }

  // Handle Save Description
  function handleSaveDescription() {
    const trimmed = descInput.trim();
    setGroupDesc(trimmed);
    if (typeof window !== "undefined") {
      localStorage.setItem(`group_desc_${conversation.id}`, trimmed);
    }
    setIsEditingDesc(false);
    toast.success("Group description updated");
  }

  async function handleAddMember(user: Profile) {
    setAddingUserId(user.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("conversation_members").insert({
        conversation_id: conversation.id,
        user_id: user.id,
        role: "member",
      });

      if (error) throw error;

      toast.success(`Added ${user.display_name} to the group`);
      setAvailableUsers((prev) => prev.filter((p) => p.id !== user.id));
      onConversationActivity?.();
    } catch {
      toast.error("Failed to add member");
    } finally {
      setAddingUserId(null);
    }
  }

  // Filter media for photos and videos only
  const mediaList = useMemo(() => {
    return sharedMedia.filter((item) => {
      const isImg =
        (item.message_type as string) === "image" ||
        Boolean(item.attachment_name?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i));
      const isVid =
        (item.message_type as string) === "video" ||
        Boolean(item.attachment_name?.match(/\.(mp4|webm|mov|mkv)$/i));
      return isImg || isVid;
    });
  }, [sharedMedia]);

  // Only 3 recent photo and video items visible on info panel
  const recentMedia = useMemo(() => mediaList.slice(0, 3), [mediaList]);

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

      toast.success(`You left "${groupName}"`);
      setConfirmLeaveOpen(false);
      onConversationActivity?.();
      router.push("/chat");
    } catch {
      toast.error("Failed to leave group");
    } finally {
      setLeaving(false);
    }
  }

  async function handleClearGroupMessages() {
    setClearing(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("conversation_id", conversation.id);

      if (error) throw error;

      setSharedMedia([]);
      toast.success("Group messages cleared");
      setConfirmClearOpen(false);
      onConversationActivity?.();
    } catch {
      toast.error("Failed to clear group messages");
    } finally {
      setClearing(false);
    }
  }

  // Sub-panel routing: Group Permissions
  if (viewingPermissions) {
    return (
      <GroupPermissionsView
        conversation={conversation}
        currentUserId={currentUserId}
        onBack={() => setViewingPermissions(false)}
        onConversationActivity={onConversationActivity}
      />
    );
  }

  // Sub-panel routing: Shared Vault
  if (viewingVault) {
    return (
      <SharedVaultView
        conversationId={conversation.id}
        title={groupName}
        onBack={() => setViewingVault(false)}
      />
    );
  }

  return (
    <>
      {/* Hidden file input for updating group avatar */}
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        onChange={(e) => void handleAvatarChange(e)}
        className="hidden"
      />

      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none border-r border-border">
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

        {/* Scrollable Container */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {/* 1. Hero Card: Compact Horizontal Hero Card with Inline Avatar & Name Editing */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/70 bg-card/60 shadow-xs">
            {/* Clickable Group Avatar with Photo Upload */}
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="relative shrink-0 group cursor-pointer"
              title="Click to change group photo"
            >
              <Avatar className="size-12 rounded-xl border border-border transition group-hover:opacity-85">
                <AvatarImage src={avatarUrl || undefined} alt={groupName} />
                <AvatarFallback className="rounded-xl text-sm font-bold bg-muted text-foreground">
                  {getInitials(groupName)}
                </AvatarFallback>
              </Avatar>

              {/* Hover upload badge */}
              <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                {uploadingAvatar ? (
                  <Loader2 className="size-4 animate-spin text-white" />
                ) : (
                  <Camera className="size-4 text-white" />
                )}
              </div>
              <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-emerald-500" />
            </div>

            {/* Group Name & Inline Pencil Editing */}
            <div className="min-w-0 flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSaveGroupName();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                    autoFocus
                    disabled={savingName}
                    className="h-7 text-xs font-semibold rounded-lg bg-background"
                  />
                  <Button
                    size="icon-sm"
                    onClick={() => void handleSaveGroupName()}
                    disabled={savingName}
                    className="size-7 rounded-lg shrink-0"
                    aria-label="Save name"
                  >
                    {savingName ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setIsEditingName(false)}
                    disabled={savingName}
                    className="size-7 rounded-lg shrink-0 hover:bg-muted"
                    aria-label="Cancel editing"
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group/name">
                  <h2 className="text-sm font-semibold text-foreground truncate leading-tight">
                    {groupName}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(groupName);
                      setIsEditingName(true);
                    }}
                    className="size-5 rounded-md hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground shrink-0 transition cursor-pointer"
                    aria-label="Edit group name"
                  >
                    <Pencil className="size-3" />
                  </button>
                </div>
              )}

              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {conversation.members.length} {conversation.members.length === 1 ? "participant" : "participants"}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="size-1.5 rounded-full shrink-0 bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-muted-foreground truncate">Active group</span>
              </div>
            </div>
          </div>

          {/* 2. Description: Group purpose text card with Edit button */}
          <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Group Purpose
              </span>
              {!isEditingDesc && (
                <button
                  type="button"
                  onClick={() => {
                    setDescInput(groupDesc);
                    setIsEditingDesc(true);
                  }}
                  className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Pencil className="size-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {isEditingDesc ? (
              <div className="space-y-2 pt-1">
                <Textarea
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  autoFocus
                  rows={3}
                  placeholder="Add a group description..."
                  className="text-xs resize-none bg-background rounded-lg"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingDesc(false)}
                    className="h-7 px-2.5 text-xs rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveDescription}
                    className="h-7 px-3 text-xs rounded-lg"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {groupDesc}
              </p>
            )}
          </div>

          {/* 3. Participants Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UsersRound className="size-3.5 text-primary" />
                <span>Participants ({conversation.members.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setAddMemberOpen(true)}
                className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3" />
                <span>Add Member</span>
              </button>
            </div>

            {/* Filter participants if > 4 */}
            {conversation.members.length > 4 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <Input
                  placeholder="Filter participants..."
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  className="h-8 pl-7 rounded-xl text-xs bg-muted/40 border-border/60"
                />
              </div>
            )}

            {/* Grouped Participants List */}
            <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
              {filteredMembers.map((member) => {
                const isOnline = onlineUserIds.has(member.user_id);
                const isSelf = member.user_id === currentUserId;
                const isAdmin = member.role === "admin" || member.role === "owner";

                return (
                  <button
                    key={member.user_id}
                    type="button"
                    onClick={() => {
                      if (!isSelf && onSelectMember) {
                        onSelectMember(member.profile);
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 p-2.5 text-left transition",
                      !isSelf ? "hover:bg-muted/60 cursor-pointer" : "opacity-90 cursor-default"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="size-8 rounded-full border border-border">
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

                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-semibold text-primary shrink-0">
                        <Shield className="size-2.5" />
                        <span>{member.role === "owner" ? "Owner" : "Admin"}</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
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

          {/* 5. Settings & Actions (Group permissions, Mute, Danger row) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
              Settings & Actions
            </span>
            <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
              {/* Group Permissions Sub-Panel Trigger */}
              <button
                type="button"
                onClick={() => setViewingPermissions(true)}
                className="flex items-center justify-between w-full p-3 hover:bg-muted/60 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Sliders className="size-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Group permissions</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Manage member and admin controls
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </button>

              {/* Mute Notifications */}
              <button
                type="button"
                onClick={() => {
                  if (onToggleMute) onToggleMute();
                  toast.success(isMuted ? "Group notifications unmuted" : "Group notifications muted");
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

              {/* Danger: Clear group messages */}
              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                className="flex items-center justify-between w-full p-3 hover:bg-muted/60 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium text-foreground">Clear group messages</span>
                </div>
              </button>

              {/* Danger: Leave group */}
              <button
                type="button"
                onClick={() => setConfirmLeaveOpen(true)}
                className="flex items-center justify-between w-full p-3 hover:bg-destructive/10 text-destructive/90 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="size-4 shrink-0" />
                  <span className="text-xs font-medium">Leave group</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="sm:max-w-md w-full p-0 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-border bg-background text-foreground">
          <DialogHeader className="p-3.5 border-b border-border/80 flex flex-row items-center justify-between shrink-0">
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">Add Member</DialogTitle>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                Invite people to {groupName}
              </p>
            </div>
          </DialogHeader>

          <div className="p-3.5 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name or username..."
                value={addMemberSearch}
                onChange={(e) => setAddMemberSearch(e.target.value)}
                className="h-9 pl-8 text-xs rounded-xl bg-muted/40 border-border/60"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-border/40">
              {loadingUsers ? (
                <div className="flex h-24 items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  <span>Searching users...</span>
                </div>
              ) : availableUsers.length > 0 ? (
                availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-2 px-1 gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="size-8 rounded-full border border-border">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
                        <AvatarFallback className="text-[10px] font-bold">
                          {getInitials(user.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {user.display_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={addingUserId === user.id}
                      onClick={() => void handleAddMember(user)}
                      className="h-7 px-2.5 text-xs rounded-lg gap-1 border-border/70 hover:bg-primary/10 hover:text-primary hover:border-primary/40 shrink-0"
                    >
                      {addingUserId === user.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <UserPlus className="size-3" />
                      )}
                      <span>Add</span>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No users found to add.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation modal before clearing messages */}
      <ConfirmActionDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title="Clear Group Messages"
        description="Are you sure you want to clear all messages in this group? This cannot be undone."
        confirmLabel="Clear"
        variant="destructive"
        loading={clearing}
        onConfirm={() => void handleClearGroupMessages()}
      />

      {/* Confirmation modal before leaving group */}
      <ConfirmActionDialog
        open={confirmLeaveOpen}
        onOpenChange={setConfirmLeaveOpen}
        title="Leave Group"
        description={`Are you sure you want to leave "${groupName}"? You will not be able to send or receive messages in this group unless re-added.`}
        confirmLabel="Leave Group"
        variant="destructive"
        loading={leaving}
        onConfirm={() => void handleLeaveGroup()}
      />
    </>
  );
}
