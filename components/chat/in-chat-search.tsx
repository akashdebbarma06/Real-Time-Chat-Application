"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InChatSearchProps {
  query: string;
  matchCount: number;
  onQueryChange: (query: string) => void;
  onClose: () => void;
}

export function InChatSearch({ query, matchCount, onQueryChange, onClose }: InChatSearchProps) {
  return (
    <div className="flex items-center gap-2 border-b bg-slate-900/90 px-4 py-2 text-xs">
      <Search className="size-4 text-cyan-400 shrink-0" />
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search messages in this chat..."
        className="h-8 border-slate-800 bg-slate-950 text-slate-100 text-xs rounded-xl focus-visible:ring-cyan-500/50"
        autoFocus
      />
      {query && (
        <span className="text-[11px] text-slate-400 shrink-0">
          {matchCount} match{matchCount !== 1 ? "es" : ""}
        </span>
      )}
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={onClose}
        className="size-7 rounded-full text-slate-400 hover:text-white"
        aria-label="Close search"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
