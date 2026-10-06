"use client";

import { MessageCircleMore, Search, UsersRound } from "lucide-react";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";

interface EmptyChatProps {
  currentUserId?: string;
  onCreated?: () => void;
}

export function EmptyChat({ currentUserId, onCreated }: EmptyChatProps) {
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

        {/* Action Button */}
        {currentUserId && (
          <div className="mt-8 flex items-center justify-center">
            <NewChatDialog
              currentUserId={currentUserId}
              onCreated={onCreated || (() => {})}
              triggerVariant="full"
            />
          </div>
        )}

        {/* Feature Highlights */}
        <div className="mt-10 grid grid-cols-2 gap-3 text-left text-xs">
          <div className="rounded-2xl border bg-card/60 p-4 shadow-sm backdrop-blur-sm">
            <Search className="mb-2.5 size-5 text-primary" />
            <p className="font-semibold text-foreground">Find Contacts</p>
            <p className="mt-1 text-[11px] text-muted-foreground leading-normal">Search friends & online users instantly.</p>
          </div>
          <div className="rounded-2xl border bg-card/60 p-4 shadow-sm backdrop-blur-sm">
            <UsersRound className="mb-2.5 size-5 text-primary" />
            <p className="font-semibold text-foreground">Group Chats</p>
            <p className="mt-1 text-[11px] text-muted-foreground leading-normal">Bring your team together in Aether Chat.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
