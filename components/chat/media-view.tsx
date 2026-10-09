"use client";

import Link from "next/link";
import { FileText, Image as ImageIcon, Search } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatConversationTime, getConversationTitle } from "@/lib/utils";
import type { ConversationSummary, Profile } from "@/types/chat";

interface MediaViewProps {
  conversations: ConversationSummary[];
  profile: Profile;
}

export function MediaView({ conversations, profile }: MediaViewProps) {
  const [filter, setFilter] = useState<"all" | "images" | "docs">("all");

  // Gather conversations with image attachments or avatars
  const mediaItems = conversations
    .filter((c) => c.last_message?.message_type === "image" || c.avatar_url)
    .map((c) => ({
      id: c.id,
      title: getConversationTitle(c, profile.id),
      url: c.avatar_url || "/avatar-placeholder.png",
      date: formatConversationTime(c.updated_at),
      type: "image",
    }));

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Shared Media</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20">
            Gallery
          </span>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 mt-3">
          {[
            { id: "all", label: "All Media" },
            { id: "images", label: "Photos" },
            { id: "docs", label: "Documents" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as "all" | "images" | "docs")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filter === tab.id
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 mt-3">
        <div className="py-2">
          {mediaItems.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground rounded-2xl border border-dashed my-4">
              <ImageIcon className="mx-auto size-8 text-muted-foreground/40 mb-2" />
              <p className="font-semibold text-foreground text-sm">No shared media yet</p>
              <p className="text-[11px] mt-1 text-muted-foreground max-w-xs mx-auto">
                Images, photos, and files shared in your chat conversations will be organized here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {mediaItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/chat/${item.id}`}
                  className="group relative rounded-2xl border border-border/70 overflow-hidden bg-card transition hover:border-purple-500/50 hover:shadow-md block text-left"
                >
                  <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.title}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">{item.date}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
