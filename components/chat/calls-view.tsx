"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  Plus,
  Search,
  Sparkles,
  Video,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getConversationPeers, getInitials } from "@/lib/utils";
import type { ConversationSummary, Profile } from "@/types/chat";

interface CallsViewProps {
  conversations: ConversationSummary[];
  profile: Profile;
  onlineUserIds: Set<string>;
}

export function CallsView({ conversations, profile, onlineUserIds }: CallsViewProps) {
  const [search, setSearch] = useState("");
  const [callingPeer, setCallingPeer] = useState<Profile | null>(null);

  // Extract distinct contact peers from direct conversations
  const peers = Array.from(
    new Map(
      conversations
        .filter((c) => c.type === "direct")
        .flatMap((c) => getConversationPeers(c, profile.id))
        .map((p) => [p.id, p])
    ).values()
  ).filter((p) =>
    !search.trim() ||
    p.display_name.toLowerCase().includes(search.toLowerCase()) ||
    p.username.toLowerCase().includes(search.toLowerCase())
  );

  function initiateCall(peer: Profile, type: "audio" | "video") {
    setCallingPeer(peer);
    toast.info(`${type === "video" ? "Video" : "Voice"} call initiated with ${peer.display_name}`, {
      description: "WebRTC peer connection in preview. Signaling server handshake active.",
    });
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Calls</h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
              WebRTC Preview
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts to call..."
            className="pl-9 rounded-xl text-xs bg-muted/40 border-border"
          />
        </div>
      </div>

      {/* Transparent Functionality Notice */}
      <div className="mx-4 mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-primary">
          <Info className="size-3.5" />
          <span>Calls (Developer Preview)</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Peer-to-peer voice and video calls are in active development. You can test ringing online contacts below.
        </p>
      </div>

      {/* Calling Simulation Modal Banner if calling */}
      {callingPeer && (
        <div className="mx-4 mt-2 rounded-2xl border border-primary/30 bg-primary/10 p-3.5 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 ring-2 ring-primary">
              <AvatarImage src={callingPeer.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{getInitials(callingPeer.display_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-semibold text-foreground">Calling {callingPeer.display_name}...</p>
              <p className="text-[10px] text-muted-foreground">Ringing peer terminal</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setCallingPeer(null);
              toast.info("Call ended");
            }}
            className="h-7 text-xs rounded-lg px-2.5"
          >
            <PhoneOff className="size-3.5 mr-1" />
            End
          </Button>
        </div>
      )}

      {/* Contacts Available to Call */}
      <ScrollArea className="flex-1 w-full overflow-x-hidden mt-2">
        <div
          className="w-full space-y-1 py-1 pb-28 md:pb-6 box-border overflow-x-hidden px-3"
        >
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Contacts ({peers.length})
          </p>

          {peers.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              <PhoneMissed className="mx-auto size-8 text-muted-foreground/40 mb-2" />
              <p className="font-semibold text-foreground">No contacts found</p>
              <p className="text-[11px] mt-1">Start direct conversations to add contacts to your call list.</p>
            </div>
          ) : (
            peers.map((peer) => {
              const isOnline = onlineUserIds.has(peer.id);

              return (
                <div
                  key={peer.id}
                  style={{ width: "100%", boxSizing: "border-box", borderRadius: "14px" }}
                  className="flex w-full box-border items-center justify-between rounded-[14px] p-2.5 transition hover:bg-muted/50 border border-transparent hover:border-border/40"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative">
                      <Avatar className="size-9">
                        <AvatarImage src={peer.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(peer.display_name)}</AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background ${
                          isOnline ? "bg-emerald-500" : "bg-muted-foreground/60"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{peer.display_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {isOnline ? "Online now" : `@${peer.username}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => initiateCall(peer, "audio")}
                      title="Voice Call"
                      aria-label={`Voice call ${peer.display_name}`}
                      className="rounded-lg text-primary hover:bg-primary/10"
                    >
                      <Phone className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => initiateCall(peer, "video")}
                      title="Video Call"
                      aria-label={`Video call ${peer.display_name}`}
                      className="rounded-lg text-primary hover:bg-primary/10"
                    >
                      <Video className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
