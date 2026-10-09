"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface NewGroupDialogProps {
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function NewGroupDialog({
  currentUserId,
  open,
  onOpenChange,
  onCreated,
}: NewGroupDialogProps) {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const supabase = createClient();
        let request = supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, bio, last_seen_at")
          .neq("id", currentUserId)
          .order("display_name")
          .limit(40);

        const safeQuery = query.trim().replace(/[,()]/g, "");
        if (safeQuery) {
          request = request.or(
            `display_name.ilike.%${safeQuery}%,username.ilike.%${safeQuery}%`
          );
        }

        const { data, error } = await request;
        if (error) {
          toast.error(error.message);
        } else {
          setUsers((data || []) as Profile[]);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [currentUserId, open, query]);

  const selectedProfiles = useMemo(
    () => users.filter((u) => selectedIds.has(u.id)),
    [selectedIds, users]
  );

  function toggleUser(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function removeSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleCreateGroup() {
    const trimmed = groupName.trim();
    if (!trimmed) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedIds.size === 0) {
      toast.error("Select at least one member to join the group");
      return;
    }

    try {
      setSubmitting(true);
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_group_conversation", {
        group_name: trimmed,
        member_ids: [...selectedIds],
      });

      if (error) {
        toast.error(error.message || "Failed to create group");
        return;
      }

      onOpenChange(false);
      setGroupName("");
      setSelectedIds(new Set());
      setQuery("");
      onCreated?.();
      toast.success(`Group "${trimmed}" created!`);
      router.push(`/chat/${data}`);
    } catch {
      toast.error("An error occurred while creating group");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setGroupName("");
          setSelectedIds(new Set());
          setQuery("");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md p-6 rounded-3xl sm:rounded-3xl border shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-1 text-left">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                New Group
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set a group name and choose participants.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 my-1">
          {/* Group Name Field */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Group Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Design Team, Family, Book Club..."
              maxLength={80}
              className="h-10 text-sm rounded-xl bg-muted/40 border-muted focus-visible:ring-purple-500/30"
              autoFocus
            />
          </div>

          {/* Selected Chips */}
          {selectedProfiles.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                Selected Members ({selectedProfiles.length})
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1 bg-muted/30 rounded-xl border border-muted/50">
                {selectedProfiles.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 text-xs font-medium"
                  >
                    <span>{p.display_name}</span>
                    <button
                      type="button"
                      onClick={() => removeSelected(p.id)}
                      className="rounded-full hover:bg-purple-500/20 p-0.5"
                      aria-label={`Remove ${p.display_name}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Member Search */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Add Members
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people by name or @username..."
                className="pl-10 h-10 text-sm rounded-xl bg-muted/40 border-muted focus-visible:ring-purple-500/30"
              />
            </div>
          </div>

          {/* User List with Checkboxes */}
          <ScrollArea className="h-56 rounded-2xl border bg-card p-1">
            {loading ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-purple-600" />
                <p className="text-xs">Loading contacts...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center p-4 text-center text-muted-foreground">
                <p className="text-xs">No users found.</p>
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {users.map((user) => {
                  const isChecked = selectedIds.has(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleUser(user.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                        isChecked ? "bg-purple-500/10" : "hover:bg-muted/70"
                      )}
                    >
                      <div
                        className={cn(
                          "grid size-5 place-items-center rounded-md border text-white transition-colors shrink-0",
                          isChecked
                            ? "bg-purple-600 border-purple-600"
                            : "border-muted-foreground/30 bg-background"
                        )}
                      >
                        {isChecked && <Check className="size-3.5 stroke-[3]" />}
                      </div>

                      <Avatar className="size-8 border shrink-0">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
                        <AvatarFallback className="text-[10px] font-semibold">
                          {getInitials(user.display_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold leading-tight text-foreground">
                          {user.display_name}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleCreateGroup()}
            disabled={submitting || !groupName.trim() || selectedIds.size === 0}
            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" />
                Creating Group...
              </>
            ) : (
              `Create Group (${selectedIds.size})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
