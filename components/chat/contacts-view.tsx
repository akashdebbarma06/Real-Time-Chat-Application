"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Search, UserCheck, Users, Zap } from "lucide-react";
import { toast } from "@/lib/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMutualContacts() {
      setLoading(true);
      const supabase = createClient();
      const { data: memberRows, error: memberErr } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", currentUserId);

      if (!memberErr && memberRows?.length) {
        const convIds = memberRows.map((r) => r.conversation_id);
        const { data: peerMemberRows } = await supabase
          .from("conversation_members")
          .select("user_id")
          .in("conversation_id", convIds)
          .neq("user_id", currentUserId);

        const peerUserIds = [...new Set((peerMemberRows || []).map((m) => m.user_id))];
        if (peerUserIds.length > 0) {
          const { data: peerProfiles } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url, bio, last_seen_at")
            .in("id", peerUserIds);

          setUsers((peerProfiles || []) as Profile[]);
        } else {
          setUsers([]);
        }
      } else {
        setUsers([]);
      }
      setLoading(false);
    }

    void loadMutualContacts();
  }, [currentUserId]);

  useEffect(() => {
    if (tab !== "search") return;
    const trimmed = query.trim().replace(/[,()]/g, "");
    if (trimmed.length < 2) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, last_seen_at")
        .neq("id", currentUserId)
        .or(`display_name.ilike.%${trimmed}%,username.ilike.%${trimmed}%`)
        .limit(20);

      if (!error && data) {
        setSearchResults(data as Profile[]);
      }
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [currentUserId, query, tab]);

  const filteredUsers = useMemo(() => {
    if (tab === "search") {
      return query.trim().length < 2 ? [] : searchResults;
    }
    let list = users;
    if (tab === "online") {
      list = list.filter((user) => onlineUserIds.has(user.id));
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (user) => user.display_name.toLowerCase().includes(q) || user.username.toLowerCase().includes(q)
    );
  }, [onlineUserIds, query, searchResults, tab, users]);

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
            placeholder="Search contacts..."
            aria-label="Search contacts by name or username"
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1 w-full overflow-x-hidden">
        <div
          className="w-full space-y-1 py-1 box-border overflow-x-hidden"
          style={{ padding: "0 12px", boxSizing: "border-box" }}
        >
          {filteredUsers.map((user) => {
            const isOnline = onlineUserIds.has(user.id);
            return (
              <button
                key={user.id}
                type="button"
                disabled={loading}
                onClick={() => void startChat(user.id)}
                style={{ width: "100%", boxSizing: "border-box", borderRadius: "14px" }}
                className="group flex w-full box-border items-center justify-between gap-3 rounded-[14px] border border-transparent p-2.5 text-left transition-all hover:bg-muted/60 hover:border-sidebar-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer disabled:pointer-events-none disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <Avatar className="size-9 border shadow-xs">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
                      <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-sidebar bg-emerald-500 shadow-xs" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{user.display_name}</p>
                    <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-muted-foreground/60 group-hover:text-primary transition-colors">
                  <MessageSquare className="size-4" aria-hidden="true" />
                  <span className="sr-only">Message {user.display_name}</span>
                </div>
              </button>
            );
          })}

          {!filteredUsers.length && (
            <div className="px-6 py-16 text-center">
              <UserCheck className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-4 text-sm font-medium">
                {tab === "search" && query.trim().length < 2
                  ? "Find people to chat with"
                  : tab === "search"
                    ? "No users found"
                    : tab === "online"
                      ? "No contacts currently online"
                      : "No contacts yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                {tab === "search" && query.trim().length < 2
                  ? "Enter a display name or @username above to search."
                  : tab === "search"
                    ? `No accounts matched "${query}". Check the spelling and try again.`
                    : tab === "online"
                      ? "When your chat partners sign on, they will appear here."
                      : "Start a new conversation to add people to your contacts."}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
