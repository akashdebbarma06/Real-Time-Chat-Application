"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus, Search } from "lucide-react";
import { toast } from "@/lib/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface NewDirectChatDialogProps {
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function NewDirectChatDialog({
  currentUserId,
  open,
  onOpenChange,
  onCreated,
}: NewDirectChatDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      try {
        const supabase = createClient();
        let request = supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, bio, last_seen_at")
          .neq("id", currentUserId)
          .order("display_name")
          .limit(30);

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

  async function handleSelectUser(user: Profile) {
    try {
      setCreatingId(user.id);
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_direct_conversation", {
        other_user: user.id,
      });

      if (error) {
        toast.error(error.message || "Could not start conversation");
        return;
      }

      onOpenChange(false);
      setQuery("");
      onCreated?.();
      toast.success(`Chat started with ${user.display_name}`);
      router.push(`/chat/${data}`);
    } catch {
      toast.error("Failed to start conversation");
    } finally {
      setCreatingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-3xl sm:rounded-3xl border shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2 text-left">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <MessageSquarePlus className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                New Conversation
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Choose a contact to start a direct one-to-one chat.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative my-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or @username..."
            className="pl-10 h-10 text-sm rounded-xl bg-muted/50 border-muted focus-visible:ring-primary/30"
            autoFocus
          />
        </div>

        {/* User list */}
        <ScrollArea className="h-72 rounded-2xl border bg-card p-1">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs">Finding contacts...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <p className="text-sm font-medium">No contacts found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {query ? "Try searching with a different name or username." : "No other users available."}
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {users.map((user) => {
                const isSelected = creatingId === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    disabled={creatingId !== null}
                    onClick={() => void handleSelectUser(user)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/80 text-foreground"
                    )}
                  >
                    <Avatar className="size-10 border shrink-0">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
                      <AvatarFallback className="text-xs font-semibold">
                        {getInitials(user.display_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-tight">
                        {user.display_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{user.username}
                      </p>
                    </div>

                    {isSelected ? (
                      <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100">
                        Chat
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
