"use client";

import { useEffect, useState } from "react";
import { BarChart3, Check, CheckCheck, Circle, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ParsedPoll {
  question: string;
  allowMultiple: boolean;
  options: { id: number; text: string }[];
}

export function parsePollContent(content: string): ParsedPoll | null {
  if (!content || !content.includes("**POLL:")) return null;

  // Extract question
  const questionMatch = content.match(/\*\*POLL:\s*([^*]+)\*\*/i);
  if (!questionMatch) return null;
  const question = questionMatch[1].trim();

  // Extract multiple vs single answer
  const allowMultiple = content.toLowerCase().includes("multiple answers allowed");

  // Extract options
  const lines = content.split("\n");
  const options: { id: number; text: string }[] = [];
  let optIndex = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("📊") || trimmed.includes("**POLL:") || trimmed.startsWith("*(")) {
      continue;
    }
    const optionMatch = trimmed.match(/^(\d+)[\.\)]\s*(?:[⬜\-\*\•]\s*)?(.*)$/);
    if (optionMatch && optionMatch[2]?.trim()) {
      options.push({
        id: optIndex++,
        text: optionMatch[2].trim(),
      });
    } else if (
      trimmed &&
      !trimmed.startsWith("**") &&
      (trimmed.startsWith("⬜") || trimmed.startsWith("- ") || trimmed.startsWith("• "))
    ) {
      const cleanText = trimmed.replace(/^[⬜\-\•\s]+/, "").trim();
      if (cleanText) {
        options.push({
          id: optIndex++,
          text: cleanText,
        });
      }
    }
  }

  if (options.length === 0) return null;

  return {
    question,
    allowMultiple,
    options,
  };
}

interface PollCardProps {
  messageId: string;
  poll: ParsedPoll;
  timestamp?: string;
  showReceipt?: boolean;
  readBySomeoneElse?: boolean;
  own?: boolean;
}

export function PollCard({
  messageId,
  poll,
  timestamp,
  showReceipt = false,
  readBySomeoneElse = false,
  own = false,
}: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(`aether_poll_${messageId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(Array.isArray(parsed) ? parsed : [parsed]);
      }
    } catch {}
    return new Set();
  });

  const handleToggleOption = (optId: number) => {
    setSelectedOptions((prev) => {
      const next = new Set(prev);
      if (poll.allowMultiple) {
        if (next.has(optId)) {
          next.delete(optId);
        } else {
          next.add(optId);
        }
      } else {
        if (next.has(optId)) {
          next.clear();
        } else {
          next.clear();
          next.add(optId);
        }
      }
      try {
        localStorage.setItem(`aether_poll_${messageId}`, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const hasVoted = selectedOptions.size > 0;
  const totalVotes = selectedOptions.size;

  return (
    <div
      className={cn(
        "relative w-full max-w-[360px] sm:max-w-[400px] box-border rounded-2xl border border-border/70 bg-card/95 text-card-foreground shadow-md p-4 transition-all select-none backdrop-blur-md",
        own ? "border-primary/30" : "border-border"
      )}
    >
      {/* Header with Poll Tag and Question */}
      <div className="flex items-start gap-2.5 mb-3">
        <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <BarChart3 className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/10 px-1.5 py-0.2 rounded-md">
              Poll
            </span>
            <span className="text-[11px] text-muted-foreground">
              {poll.allowMultiple ? "Select one or more" : "Select one"}
            </span>
          </div>
          <h4 className="font-bold text-sm text-foreground leading-snug break-words">
            {poll.question}
          </h4>
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-2 mb-3">
        {poll.options.map((opt) => {
          const isSelected = selectedOptions.has(opt.id);
          const votePercentage = hasVoted ? (isSelected ? 100 : 0) : 0;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleToggleOption(opt.id)}
              className={cn(
                "relative group flex items-center justify-between w-full p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer overflow-hidden",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground font-medium shadow-xs"
                  : "border-border/60 hover:border-primary/40 hover:bg-muted/50 text-muted-foreground"
              )}
            >
              {/* Animated Progress Bar */}
              {hasVoted && (
                <div
                  style={{ width: `${votePercentage}%` }}
                  className={cn(
                    "absolute inset-y-0 left-0 bg-primary/15 transition-all duration-300 pointer-events-none",
                    isSelected ? "opacity-100" : "opacity-0"
                  )}
                />
              )}

              {/* Option Text */}
              <span className="relative z-10 flex-1 min-w-0 pr-2 truncate">
                {opt.text}
              </span>

              {/* Selection Checkmark / Icon */}
              <div className="relative z-10 shrink-0 flex items-center justify-center">
                {poll.allowMultiple ? (
                  isSelected ? (
                    <div className="size-4 rounded bg-primary text-primary-foreground grid place-items-center shadow-xs">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                  ) : (
                    <Square className="size-4 text-muted-foreground/60 group-hover:text-foreground" />
                  )
                ) : (
                  isSelected ? (
                    <div className="size-4 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-xs">
                      <div className="size-1.5 rounded-full bg-primary-foreground" />
                    </div>
                  ) : (
                    <Circle className="size-4 text-muted-foreground/60 group-hover:text-foreground" />
                  )
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Poll Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground font-mono">
        <span>
          {hasVoted ? `${totalVotes} vote${totalVotes !== 1 ? "s" : ""}` : "Vote to see results"}
        </span>

        {timestamp && (
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="whitespace-nowrap">{timestamp}</span>
            {own && showReceipt && (
              readBySomeoneElse ? (
                <CheckCheck className="size-3 text-primary shrink-0" aria-label="Read" />
              ) : (
                <Check className="size-3 text-muted-foreground shrink-0" aria-label="Sent" />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
