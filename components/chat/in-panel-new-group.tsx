"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Search, Users, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface InPanelNewGroupProps {
  currentUserId: string;
  onBack: () => void;
  onCreated?: () => void;
}

export function InPanelNewGroup({
  currentUserId,
  onBack,
  onCreated,
}: InPanelNewGroupProps) {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
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
  }, [currentUserId, query]);

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
      toast.error("Select at least one member");
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

      onBack();
      setGroupName("");
      setSelectedIds(new Set());
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
    <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
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
            <h3 className="text-sm font-semibold text-foreground truncate">New Group</h3>
            <p className="text-[11px] text-muted-foreground truncate">
              {selectedIds.size} member{selectedIds.size !== 1 ? "s" : ""} selected
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          disabled={!groupName.trim() || selectedIds.size === 0 || submitting}
          onClick={() => void handleCreateGroup()}
          className="h-7 px-3 text-xs font-semibold rounded-xl"
        >
          {submitting ? <Loader2 className="size-3.5 animate-spin" /> : "Create"}
        </Button>
      </div>

      {/* Group Name input */}
      <div className="p-3 border-b border-border/60 shrink-0 space-y-2">
        <Input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name..."
          maxLength={80}
          className="h-9 text-xs rounded-xl bg-muted/50 border-muted focus-visible:ring-primary/40 font-medium"
          autoFocus
        />

        {/* Selected Member Chips */}
        {selectedProfiles.length > 0 && (
          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto scrollbar-thin">
            {selectedProfiles.map((user) => (
              <span
                key={user.id}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary"
              >
                <span className="truncate max-w-20">{user.display_name}</span>
                <button
                  type="button"
                  onClick={() => removeSelected(user.id)}
                  className="rounded-full hover:bg-primary/20 p-0.5 cursor-pointer"
                >
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search contacts input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members to add..."
            className="pl-8 h-8 text-[11px] rounded-xl bg-muted/30 border-muted/80"
          />
        </div>
      </div>

      {/* Contact list with checkmarks */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {loading ? (
          <div className="flex h-36 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" />
            <p className="text-xs">Loading contacts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center p-4 text-center text-muted-foreground">
            <p className="text-xs font-medium">No contacts found</p>
          </div>
        ) : (
          users.map((user) => {
            const isSelected = selectedIds.has(user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => toggleUser(user.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-all cursor-pointer hover:bg-muted/70",
                  isSelected && "bg-primary/10"
                )}
              >
                <Avatar className="size-8 border shrink-0">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
                  <AvatarFallback className="text-[10px] font-semibold">
                    {getInitials(user.display_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground leading-tight">
                    {user.display_name}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    @{user.username}
                  </p>
                </div>

                <div
                  className={cn(
                    "grid size-5 place-items-center rounded-lg border transition-all shrink-0",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground shadow-xs"
                      : "border-muted-foreground/30 bg-muted/40"
                  )}
                >
                  {isSelected && <Check className="size-3 stroke-[3]" />}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
