"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Download,
  MessageCircleMore,
  MoreVertical,
  Phone,
  Search,
  Sparkles,
  Trash2,
  User,
  UsersRound,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { ConversationAvatar } from "@/components/chat/conversation-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ConversationSummary, Profile } from "@/types/chat";

interface MessageHeaderProps {
  title: string;
  conversation?: ConversationSummary;
  profile: Profile;
  peers: Profile[];
  isPeerOnline: boolean;
  statusText: string;
  typingLabel: string;
  isMuted: boolean;
  isSearching: boolean;
  onToggleSearch: () => void;
  onToggleMute: () => void;
  onExportHistory: () => void;
  onClearHistory: () => void;
  onOpenProfile: () => void;
  onOpenFeature: (featureName: string) => void;
}

export function MessageHeader({
  title,
  conversation,
  profile,
  isPeerOnline,
  statusText,
  typingLabel,
  isMuted,
  isSearching,
  onToggleSearch,
  onToggleMute,
  onExportHistory,
  onClearHistory,
  onOpenProfile,
  onOpenFeature,
}: MessageHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/90 px-3 backdrop-blur-xl sm:px-5">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Button asChild variant="ghost" size="icon-sm" className="md:hidden">
          <Link href="/chat" aria-label="Back to conversations">
            <ArrowLeft />
          </Link>
        </Button>

        <button
          onClick={onOpenProfile}
          className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition"
        >
          <div className="relative shrink-0">
            {conversation ? (
              <ConversationAvatar conversation={conversation} userId={profile.id} className="size-10" />
            ) : (
              <div className="grid size-10 place-items-center rounded-full bg-muted">
                <MessageCircleMore className="size-5" />
              </div>
            )}
            {conversation?.type === "direct" && (
              <span
                className={cn(
                  "absolute bottom-0 right-0 size-3 rounded-full border-2 border-background shadow-sm",
                  isPeerOnline ? "bg-emerald-500" : "bg-slate-400"
                )}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold">{title}</h1>
              {isMuted && <BellOff className="size-3.5 text-muted-foreground shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn(
                  "size-2 rounded-full shrink-0",
                  isPeerOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                )}
              />
              <span className="truncate">{typingLabel || statusText}</span>
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onOpenFeature("Aether AI Assistant")}
          aria-label="AI Assistant"
          className="rounded-full text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
          title="Aether AI Assistant"
        >
          <Sparkles className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onOpenFeature("Voice Calls")}
          aria-label="Audio Call"
          className="rounded-full text-slate-300 hover:bg-slate-800"
          title="Start Voice Call"
        >
          <Phone className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onOpenFeature("Video Calls & Screen Sharing")}
          aria-label="Video Call"
          className="rounded-full text-slate-300 hover:bg-slate-800"
          title="Start Video Call"
        >
          <Video className="size-4" />
        </Button>

        <Button
          variant={isSearching ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={onToggleSearch}
          aria-label="Search within chat"
          className="rounded-full"
        >
          <Search className="size-4" />
        </Button>

        {conversation?.type === "group" && (
          <Button variant="ghost" size="icon-sm" aria-label="Group members" className="rounded-full">
            <UsersRound className="size-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Conversation options" className="rounded-full">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" className="w-56 bg-slate-900 border-slate-800 text-slate-100 p-1 rounded-2xl shadow-xl">
            <DropdownMenuItem
              onClick={onOpenProfile}
              className="flex items-center gap-2 text-xs rounded-xl cursor-pointer"
            >
              <User className="size-4 text-cyan-400" />
              <span>View Contact Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onToggleSearch}
              className="flex items-center gap-2 text-xs rounded-xl cursor-pointer"
            >
              <Search className="size-4 text-cyan-400" />
              <span>Search in Chat</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                onToggleMute();
                toast.success(isMuted ? "Notifications unmuted" : "Notifications muted");
              }}
              className="flex items-center gap-2 text-xs rounded-xl cursor-pointer"
            >
              {isMuted ? <Bell className="size-4 text-emerald-400" /> : <BellOff className="size-4 text-amber-400" />}
              <span>{isMuted ? "Unmute Notifications" : "Mute Notifications"}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onExportHistory}
              className="flex items-center gap-2 text-xs rounded-xl cursor-pointer"
            >
              <Download className="size-4 text-cyan-400" />
              <span>Export Chat Transcript</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-slate-800 my-1" />

            <DropdownMenuItem
              onClick={onClearHistory}
              className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 rounded-xl cursor-pointer"
            >
              <Trash2 className="size-4" />
              <span>Clear Chat History</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
