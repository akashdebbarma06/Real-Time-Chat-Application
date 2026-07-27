"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Search, UserCheck, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { ConversationAvatar } from "@/components/chat/conversation-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface ContactsViewProps {
  currentUserId: string;
  onlineUserIds: Set<string>;
  onConversationCreated: () => void;
}

export function ContactsView({ currentUserId, onlineUserIds, onConversationCreated }: ContactsViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"friends" | "online" | "search">("friends");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProfiles() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, last_seen_at")
        .neq("id", currentUserId)
        .order("display_name")
        .limit(50);

      if (error) toast.error(error.message);
      else setUsers((data || []) as Profile[]);
      setLoading(false);
    }

    void loadProfiles();
  }, [currentUserId]);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (tab === "online") {
      list = list.filter((user) => onlineUserIds.has(user.id));
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (user) => user.display_name.toLowerCase().includes(q) || user.username.toLowerCase().includes(q)
    );
  }, [onlineUserIds, query, tab, users]);

  async function startChat(userId: string) {
    setLoading(true);
    const { data, error } = await createClient().rpc("create_direct_conversation", { other_user: userId });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    onConversationCreated();
    router.push(`/chat/${data}`);
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Header Tabs */}
      <div className="border-b border-sidebar-border p-3">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1 text-xs font-medium">
          <button
            onClick={() => setTab("friends")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
              tab === "friends" ? "bg-background font-semibold text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="size-3.5" />
            <span>Friends</span>
          </button>

          <button
            onClick={() => setTab("online")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
              tab === "online" ? "bg-background font-semibold text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="size-3.5 text-emerald-500" />
            <span>Online ({onlineUserIds.size})</span>
          </button>

          <button
            onClick={() => setTab("search")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
              tab === "search" ? "bg-background font-semibold text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="size-3.5" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-sidebar-border bg-background/70 pl-9 rounded-xl text-xs"
            placeholder="Search contacts by name or @username..."
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 py-2">
          {filteredUsers.map((user) => {
            const isOnline = onlineUserIds.has(user.id);
            return (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-sidebar-border/60 bg-muted/40 p-3 transition-all hover:bg-muted/80 hover:border-sidebar-border"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar className="size-10 border shadow-sm">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
                      <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-sidebar bg-emerald-500 shadow-sm" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{user.display_name}</p>
                    <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => void startChat(user.id)}
                  className="rounded-full gap-1 text-xs shrink-0"
                >
                  <MessageSquare className="size-3.5" />
                  <span>Message</span>
                </Button>
              </div>
            );
          })}

          {!filteredUsers.length && (
            <div className="px-6 py-16 text-center">
              <UserCheck className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-4 text-sm font-medium">No contacts found</p>
              <p className="mt-1 text-xs text-muted-foreground">Try searching for a different username.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
