"use client";

import { useState } from "react";
import { CircleDot, Clock, Info, Plus, Sparkles, User } from "lucide-react";
import { toast } from "@/lib/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getConversationPeers, getInitials } from "@/lib/utils";
import type { ConversationSummary, Profile } from "@/types/chat";

interface StatusViewProps {
  profile: Profile;
  conversations: ConversationSummary[];
}

export function StatusView({ profile, conversations }: StatusViewProps) {
  const [myStatus, setMyStatus] = useState<string>("Hey there! I am using Aether Chat.");
  const [statusInput, setStatusInput] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const sampleContacts = Array.from(
    new Map(
      conversations
        .filter((c) => c.type === "direct")
        .flatMap((c) => getConversationPeers(c, profile.id))
        .map((p) => [p.id, p])
    ).values()
  ).slice(0, 8);

  function handleSaveStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!statusInput.trim()) return;
    setMyStatus(statusInput.trim());
    setDialogOpen(false);
    toast.success("Status updated!");
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Status</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20">
            Preview
          </span>
        </div>
      </div>

      {/* Notice */}
      <div className="mx-4 mt-3 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400">
          <Info className="size-3.5" />
          <span>Stories & Ephemeral Status</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Status broadcasts expire after 24 hours. Full multimedia photo stories are in preview.
        </p>
      </div>

      <ScrollArea className="flex-1 px-4 mt-3">
        <div className="space-y-4 pb-4">
          {/* My Status Card */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">My Status</p>
            <button
              type="button"
              onClick={() => {
                setStatusInput(myStatus);
                setDialogOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 hover:bg-muted/40 transition text-left cursor-pointer"
            >
              <div className="relative">
                <Avatar className="size-11 ring-2 ring-purple-500/30">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{getInitials(profile.display_name)}</AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 grid size-4 place-items-center rounded-full bg-purple-600 text-white text-[10px] shadow-xs">
                  <Plus className="size-3" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">My Status</p>
                <p className="text-[11px] text-muted-foreground truncate">{myStatus}</p>
              </div>
            </button>
          </div>

          {/* Recent Updates from Contacts */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recent Updates</p>

            {sampleContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground rounded-2xl border border-dashed">
                <CircleDot className="mx-auto size-6 text-muted-foreground/40 mb-1.5" />
                <p className="font-semibold text-foreground">No recent updates</p>
                <p className="text-[10px] mt-0.5">When contacts post status stories, they appear here.</p>
              </div>
            ) : (
              sampleContacts.map((contact, idx) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-muted/40 border border-transparent hover:border-border/40"
                >
                  <div className="rounded-full p-0.5 ring-2 ring-purple-500/60">
                    <Avatar className="size-10">
                      <AvatarImage src={contact.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{getInitials(contact.display_name)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{contact.display_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {idx % 2 === 0 ? "Today, 10:45 AM" : "Yesterday, 8:12 PM"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Status Edit Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Your Status</DialogTitle>
            <DialogDescription>
              Set a status message visible to your contacts for the next 24 hours.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveStatus} className="space-y-4 pt-2">
            <Input
              required
              maxLength={100}
              placeholder="What's on your mind?"
              value={statusInput}
              onChange={(e) => setStatusInput(e.target.value)}
              className="rounded-xl"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl text-xs bg-purple-600 hover:bg-purple-500 text-white">
                Save Status
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
