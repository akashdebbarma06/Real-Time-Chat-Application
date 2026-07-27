"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface NewChatDialogProps {
  currentUserId: string;
  onCreated: () => void;
}

export function NewChatDialog({ currentUserId, onCreated }: NewChatDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"direct" | "group">("direct");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      const supabase = createClient();
      let request = supabase.from("profiles").select("id, username, display_name, avatar_url, bio, last_seen_at").neq("id", currentUserId).order("display_name").limit(30);
      const safeQuery = query.trim().replace(/[,()]/g, "");
      if (safeQuery) request = request.or(`display_name.ilike.%${safeQuery}%,username.ilike.%${safeQuery}%`);
      const { data, error } = await request;
      if (error) toast.error(error.message);
      else setUsers((data || []) as Profile[]);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentUserId, open, query]);

  const selectedProfiles = useMemo(() => users.filter((user) => selected.has(user.id)), [selected, users]);

  async function createDirect(userId: string) {
    setLoading(true);
    const { data, error } = await createClient().rpc("create_direct_conversation", { other_user: userId });
    setLoading(false);
    if (error) return toast.error(error.message);
    setOpen(false);
    onCreated();
    router.push(`/chat/${data}`);
  }

  async function createGroup() {
    if (!groupName.trim()) return toast.error("Give the group a name");
    if (selected.size < 1) return toast.error("Select at least one person");
    setLoading(true);
    const { data, error } = await createClient().rpc("create_group_conversation", { group_name: groupName.trim(), member_ids: [...selected] });
    setLoading(false);
    if (error) return toast.error(error.message);
    setOpen(false);
    onCreated();
    router.push(`/chat/${data}`);
  }

  function reset(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setSelected(new Set());
      setGroupName("");
      setMode("direct");
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild><Button size="icon-sm" aria-label="Start a conversation"><UserPlus /></Button></DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Start a conversation</DialogTitle><DialogDescription>Message someone directly or bring a group together.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
          <Button type="button" variant={mode === "direct" ? "secondary" : "ghost"} onClick={() => setMode("direct")}><UserPlus />Direct</Button>
          <Button type="button" variant={mode === "group" ? "secondary" : "ghost"} onClick={() => setMode("group")}><UsersRound />Group</Button>
        </div>
        {mode === "group" && <Input value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength={80} placeholder="Group name" />}
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people" /></div>
        {mode === "group" && selectedProfiles.length > 0 && <div className="flex flex-wrap gap-2">{selectedProfiles.map((profile) => <button key={profile.id} onClick={() => setSelected((current) => { const next = new Set(current); next.delete(profile.id); return next; })} className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">{profile.display_name} ×</button>)}</div>}
        <ScrollArea className="h-72 rounded-xl border">
          <div className="space-y-1 p-2">
            {users.map((profile) => {
              const isSelected = selected.has(profile.id);
              return <button key={profile.id} disabled={loading} onClick={() => mode === "direct" ? void createDirect(profile.id) : setSelected((current) => { const next = new Set(current); if (next.has(profile.id)) next.delete(profile.id); else next.add(profile.id); return next; })} className={cn("flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-accent", isSelected && "bg-accent")}>
                <Avatar><AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} /><AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback></Avatar>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{profile.display_name}</span><span className="block truncate text-xs text-muted-foreground">@{profile.username}</span></span>
                {isSelected && <Check className="size-4 text-primary" />}
              </button>;
            })}
            {!users.length && <p className="p-8 text-center text-sm text-muted-foreground">No people found.</p>}
          </div>
        </ScrollArea>
        {mode === "group" && <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => void createGroup()} disabled={loading}>{loading && <Loader2 className="animate-spin" />}Create group</Button></DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
