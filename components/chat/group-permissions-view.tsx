"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  History,
  Link as LinkIcon,
  Loader2,
  Lock,
  MessageSquare,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  UserCheck,
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
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import type { ConversationMember, ConversationSummary } from "@/types/chat";
import type { MemberRole } from "@/types/database";

export interface GroupPermissions {
  editSettings: boolean;
  sendMessages: boolean;
  addMembers: boolean;
  inviteViaLink: boolean;
  sendMessageHistory: boolean;
  approveNewMembers: boolean;
}

const defaultPermissions: GroupPermissions = {
  editSettings: true,
  sendMessages: true,
  addMembers: true,
  inviteViaLink: true,
  sendMessageHistory: true,
  approveNewMembers: false,
};

export interface GroupPermissionsViewProps {
  conversation: ConversationSummary;
  currentUserId: string;
  onBack: () => void;
  onConversationActivity?: () => void;
}

export function GroupPermissionsView({
  conversation,
  currentUserId,
  onBack,
  onConversationActivity,
}: GroupPermissionsViewProps) {
  const [permissions, setPermissions] = useState<GroupPermissions>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`group_perms_${conversation.id}`);
      if (saved) {
        try {
          return { ...defaultPermissions, ...JSON.parse(saved) };
        } catch {
          // ignore parsing error
        }
      }
    }
    return defaultPermissions;
  });

  const [members, setMembers] = useState<ConversationMember[]>(conversation.members);
  const [editAdminsOpen, setEditAdminsOpen] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // Sync permissions to localStorage
  function updatePermission<K extends keyof GroupPermissions>(key: K, value: boolean) {
    const updated = { ...permissions, [key]: value };
    setPermissions(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(`group_perms_${conversation.id}`, JSON.stringify(updated));
    }
    toast.success("Group permission updated");
  }

  // Count admins
  const adminCount = members.filter(
    (m) => m.role === "admin" || m.role === "owner"
  ).length;

  // Filter members in Edit Admins modal
  const filteredMembers = members.filter((m) => {
    if (!adminSearch.trim()) return true;
    const q = adminSearch.toLowerCase();
    return (
      m.profile.display_name.toLowerCase().includes(q) ||
      m.profile.username.toLowerCase().includes(q)
    );
  });

  // Toggle admin role for a member
  async function handleToggleAdminRole(member: ConversationMember) {
    if (member.role === "owner") {
      toast.error("Group owner cannot be demoted");
      return;
    }

    const newRole: MemberRole = member.role === "admin" ? "member" : "admin";
    setUpdatingRoleId(member.user_id);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("conversation_members")
        .update({ role: newRole })
        .eq("conversation_id", conversation.id)
        .eq("user_id", member.user_id);

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === member.user_id ? { ...m, role: newRole } : m
        )
      );
      toast.success(
        newRole === "admin"
          ? `Promoted ${member.profile.display_name} to Admin`
          : `Dismissed ${member.profile.display_name} as Admin`
      );
      onConversationActivity?.();
    } catch {
      toast.error("Failed to update member role");
    } finally {
      setUpdatingRoleId(null);
    }
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none border-r border-border">
      {/* Sticky Header */}
      <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          className="rounded-xl size-8 shrink-0 hover:bg-muted"
          aria-label="Back to Group Info"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">Group permissions</h3>
          <p className="text-[11px] text-muted-foreground truncate">
            {conversation.name || "Group"}
          </p>
        </div>
      </div>

      {/* Scrollable Permissions Body */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-5">
        {/* Section 1: Members can */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
            Members can:
          </span>

          <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
            {/* 1. Edit group settings */}
            <div className="flex items-center justify-between p-3 gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">Edit group settings</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Change name, icon, and description
                </p>
              </div>
              <Switch
                checked={permissions.editSettings}
                onCheckedChange={(val) => updatePermission("editSettings", val)}
              />
            </div>

            {/* 2. Send new messages */}
            <div className="flex items-center justify-between p-3 gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">Send new messages</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Send messages, media, and voice notes
                </p>
              </div>
              <Switch
                checked={permissions.sendMessages}
                onCheckedChange={(val) => updatePermission("sendMessages", val)}
              />
            </div>

            {/* 3. Add other members */}
            <div className="flex items-center justify-between p-3 gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">Add other members</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Add participants to the group chat
                </p>
              </div>
              <Switch
                checked={permissions.addMembers}
                onCheckedChange={(val) => updatePermission("addMembers", val)}
              />
            </div>

            {/* 4. Invite via link */}
            <div className="flex items-center justify-between p-3 gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">Invite via link</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Allow members to share group invite link
                </p>
              </div>
              <Switch
                checked={permissions.inviteViaLink}
                onCheckedChange={(val) => updatePermission("inviteViaLink", val)}
              />
            </div>

            {/* 5. Send message history */}
            <div className="flex items-center justify-between p-3 gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">Send message history</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Past messages can be sent to new members
                </p>
              </div>
              <Switch
                checked={permissions.sendMessageHistory}
                onCheckedChange={(val) => updatePermission("sendMessageHistory", val)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Admins can */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
            Admins can:
          </span>

          <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden shadow-xs">
            {/* Approve new members */}
            <div className="flex items-center justify-between p-3 gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">Approve new members</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Require admin approval before joining
                </p>
              </div>
              <Switch
                checked={permissions.approveNewMembers}
                onCheckedChange={(val) => updatePermission("approveNewMembers", val)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Group admins */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
            Group admins
          </span>

          <div className="rounded-xl border border-border/70 bg-card/60 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setEditAdminsOpen(true)}
              className="flex items-center justify-between w-full p-3 hover:bg-muted/60 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Edit group admins</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {adminCount} {adminCount === 1 ? "admin" : "admins"} assigned
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Group Admins Dialog */}
      <Dialog open={editAdminsOpen} onOpenChange={setEditAdminsOpen}>
        <DialogContent className="sm:max-w-md w-full p-0 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-border bg-background text-foreground">
          <DialogHeader className="p-3.5 border-b border-border/80 flex flex-row items-center justify-between shrink-0">
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">Edit group admins</DialogTitle>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                Assign or remove admin rights for participants
              </p>
            </div>
          </DialogHeader>

          <div className="p-3.5 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search participants..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="h-8 pl-8 text-xs rounded-xl bg-muted/40 border-border/60"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 divide-y divide-border/40">
              {filteredMembers.map((member) => {
                const isOwner = member.role === "owner";
                const isAdmin = member.role === "admin";
                const isUpdating = updatingRoleId === member.user_id;

                return (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between py-2 px-1 gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="size-8 rounded-full border border-border">
                        <AvatarImage src={member.profile.avatar_url || undefined} alt={member.profile.display_name} />
                        <AvatarFallback className="text-[10px] font-bold">
                          {getInitials(member.profile.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {member.profile.display_name}
                          </p>
                          {isOwner && (
                            <span className="text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded-full border border-primary/20">
                              Owner
                            </span>
                          )}
                          {isAdmin && (
                            <span className="text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded-full border border-primary/20">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          @{member.profile.username}
                        </p>
                      </div>
                    </div>

                    {!isOwner && (
                      <Button
                        size="sm"
                        variant={isAdmin ? "ghost" : "outline"}
                        disabled={isUpdating}
                        onClick={() => void handleToggleAdminRole(member)}
                        className={`h-7 px-2.5 text-xs rounded-lg shrink-0 ${
                          isAdmin
                            ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                            : "hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                        }`}
                      >
                        {isUpdating ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : isAdmin ? (
                          <span>Dismiss</span>
                        ) : (
                          <span>Make Admin</span>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
