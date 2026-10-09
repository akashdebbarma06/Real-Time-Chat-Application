"use client";

import { useState } from "react";
import { ChevronRight, MessageCircleMore, Search, UsersRound } from "lucide-react";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";

interface EmptyChatProps {
  currentUserId?: string;
  onCreated?: () => void;
}

export function EmptyChat({ currentUserId, onCreated }: EmptyChatProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <section className="hidden h-svh min-h-0 flex-1 items-center justify-center bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_60%)] bg-background p-8 md:flex">
      <div className="max-w-md text-center">
        {/* Large 💬 Icon Badge */}
        <div className="mx-auto grid size-24 place-items-center rounded-3xl border border-primary/20 bg-primary/10 text-primary shadow-2xl shadow-primary/15 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <MessageCircleMore className="size-11" />
        </div>

        {/* Title & Description */}
        <h2 className="mt-7 text-2xl font-bold tracking-tight text-foreground">Welcome to Aether Chat</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Select a conversation from the sidebar or start a new chat to begin messaging.
        </p>

        {/* Action Button - Issue 6: Proportional CTA */}
        {currentUserId && (
          <div className="mt-6 flex items-center justify-center">
            <NewChatDialog
              currentUserId={currentUserId}
              onCreated={onCreated || (() => {})}
              triggerVariant="full"
              open={dialogOpen}
              onOpenChange={setDialogOpen}
            />
          </div>
        )}

        {/* Feature Highlights - Issues 2 & 4: Interactive Cards + Accessible Font Size */}
        <div className="mt-8 grid grid-cols-2 gap-3 text-left">
          {/* Find Contacts Card */}
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card/60 p-4 shadow-xs transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <Search className="size-4" />
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="font-semibold text-sm text-foreground">Find Contacts</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Search friends & online users instantly.
              </p>
            </div>
          </button>

          {/* Group Chats Card */}
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card/60 p-4 shadow-xs transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <UsersRound className="size-4" />
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="font-semibold text-sm text-foreground">Group Chats</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Bring your team together in Aether Chat.
              </p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
