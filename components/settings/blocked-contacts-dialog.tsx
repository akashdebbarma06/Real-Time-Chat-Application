"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ShieldAlert, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface BlockedContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}

interface BlockedUserItem {
  blocked_id: string;
  created_at: string;
  profile?: Profile;
}

export function BlockedContactsDialog({
  open,
  onOpenChange,
  currentUserId,
}: BlockedContactsDialogProps) {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const fetchBlockedList = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("blocked_users")
        .select("blocked_id, created_at")
        .eq("blocker_id", currentUserId);

      if (error) throw error;

      if (!data || data.length === 0) {
        setBlockedUsers([]);
        return;
      }

      const blockedIds = data.map((item) => item.blocked_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, last_seen_at")
        .in("id", blockedIds);

      const profileMap = new Map<string, Profile>();
      (profilesData || []).forEach((p) => {
        profileMap.set(p.id, p as Profile);
      });

      const fullList: BlockedUserItem[] = data.map((item) => ({
        blocked_id: item.blocked_id,
        created_at: item.created_at,
        profile: profileMap.get(item.blocked_id),
      }));

      setBlockedUsers(fullList);
    } catch (err) {
      console.error("Error fetching blocked users:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (open) {
      void fetchBlockedList();
    }
  }, [open, fetchBlockedList]);

  async function handleUnblock(blockedId: string, displayName?: string) {
    setUnblockingId(blockedId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", currentUserId)
        .eq("blocked_id", blockedId);

      if (error) throw error;

      setBlockedUsers((prev) => prev.filter((item) => item.blocked_id !== blockedId));
      toast.success(`${displayName || "User"} unblocked successfully`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unblock user";
      toast.error(message);
    } finally {
      setUnblockingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <UserX className="size-5" />
          </div>
          <DialogTitle>Blocked Contacts</DialogTitle>
          <DialogDescription>
            Blocked users cannot send you direct messages or see your presence.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs">Loading blocked list...</p>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <div className="grid size-12 place-items-center rounded-2xl bg-muted/60 mb-3 text-muted-foreground">
                <UserCheck className="size-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">No blocked contacts</p>
              <p className="text-xs max-w-xs mt-1 text-muted-foreground">
                When you block someone, they will appear here and won&apos;t be able to contact you.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-72 pr-2">
              <div className="space-y-2">
                {blockedUsers.map(({ blocked_id, profile }) => (
                  <div
                    key={blocked_id}
                    className="flex items-center justify-between rounded-xl border bg-muted/30 p-2.5 transition hover:bg-muted/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-9 border border-border">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(profile?.display_name || "Blocked User")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {profile?.display_name || "Unknown User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{profile?.username || blocked_id.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblock(blocked_id, profile?.display_name)}
                      disabled={unblockingId === blocked_id}
                      className="h-8 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      {unblockingId === blocked_id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        "Unblock"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
