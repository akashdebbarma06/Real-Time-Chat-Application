"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MessageSquarePlus, Search } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface InPanelDirectChatProps {
  currentUserId: string;
  onBack: () => void;
  onCreated?: () => void;
}

export function InPanelDirectChat({
  currentUserId,
  onBack,
  onCreated,
}: InPanelDirectChatProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);

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

      onBack();
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
    <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
      {/* Header with Back button */}
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
          <h3 className="text-sm font-semibold text-foreground truncate">New Conversation</h3>
          <p className="text-[11px] text-muted-foreground truncate">Select a contact to message</p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-3 border-b border-border/60 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or @username..."
            className="pl-9 h-9 text-xs rounded-xl bg-muted/50 border-muted focus-visible:ring-primary/40"
            autoFocus
          />
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" />
            <p className="text-xs">Finding contacts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center p-4 text-center text-muted-foreground">
            <p className="text-xs font-medium">No contacts found</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {query ? "Try a different search." : "No other users available."}
            </p>
          </div>
        ) : (
          users.map((user) => {
            const isSelected = creatingId === user.id;
            return (
              <button
                key={user.id}
                type="button"
                disabled={creatingId !== null}
                onClick={() => void handleSelectUser(user)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-all cursor-pointer hover:bg-muted/70",
                  isSelected && "bg-primary/10 text-primary"
                )}
              >
                <Avatar className="size-9 border shrink-0">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
                  <AvatarFallback className="text-xs font-semibold">
                    {getInitials(user.display_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground leading-tight">
                    {user.display_name}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    @{user.username}
                  </p>
                </div>

                {isSelected && (
                  <Loader2 className="size-3.5 animate-spin text-primary shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
