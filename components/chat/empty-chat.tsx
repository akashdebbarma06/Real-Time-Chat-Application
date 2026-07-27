"use client";

import { MessageCircleMore, Search, UsersRound } from "lucide-react";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";

export function EmptyChat({ currentUserId }: { currentUserId?: string }) {
  return (
    <section className="hidden h-svh flex-1 items-center justify-center bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_45%)] bg-slate-950 p-8 md:flex">
      <div className="max-w-md text-center">
        {/* Large 💬 Icon Badge */}
        <div className="mx-auto grid size-24 place-items-center rounded-3xl border border-slate-800 bg-slate-900/90 text-cyan-400 shadow-2xl shadow-cyan-500/10 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <MessageCircleMore className="size-11" />
        </div>

        {/* Title & Description */}
        <h2 className="mt-7 text-2xl font-bold tracking-tight text-slate-100">No conversation selected</h2>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          Choose a chat or start a new one to begin messaging.
        </p>

        {/* Action Button */}
        {currentUserId && (
          <div className="mt-8 flex items-center justify-center">
            <NewChatDialog
              currentUserId={currentUserId}
              onCreated={() => {}}
              triggerVariant="full"
            />
          </div>
        )}

        {/* Feature Highlights */}
        <div className="mt-10 grid grid-cols-2 gap-3 text-left text-xs">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
            <Search className="mb-2.5 size-5 text-cyan-400" />
            <p className="font-semibold text-slate-200">Find Contacts</p>
            <p className="mt-1 text-[11px] text-slate-400 leading-normal">Search friends & online users instantly.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
            <UsersRound className="mb-2.5 size-5 text-cyan-400" />
            <p className="font-semibold text-slate-200">Group Chats</p>
            <p className="mt-1 text-[11px] text-slate-400 leading-normal">Bring your team together in one sphere.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
