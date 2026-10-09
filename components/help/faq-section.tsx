"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  HelpCircle,
  Lock,
  Mail,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserX,
  Zap,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FAQItem {
  id: string;
  category: "basics" | "security" | "messages" | "privacy";
  question: string;
  answer: string;
  badge?: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "2fa-setup",
    category: "security",
    question: "How do I configure Two-Factor Authentication (2FA)?",
    answer:
      "Go to Settings → Account → Two-Step Verification. Click the toggle to begin enrollment. Scan the generated QR code using Google Authenticator, Authy, or 1Password, then enter the 6-digit confirmation code to activate 2FA.",
    badge: "Security",
  },
  {
    id: "blocked-users",
    category: "privacy",
    question: "How do I block or unblock someone?",
    answer:
      "You can manage your blocked contacts in Settings → Privacy & Security → Blocked Contacts. When blocked, the user cannot send you messages or view your presence. You can unblock them at any time from the Blocked Contacts dialog.",
    badge: "Privacy",
  },
  {
    id: "change-password",
    category: "security",
    question: "How can I update my password or email address?",
    answer:
      "In Settings → Account, select 'Change Password' to set a new password (min. 8 characters with strength scoring). To change your email address, click 'Change' next to your email; verification links will be sent to confirm ownership.",
    badge: "Account",
  },
  {
    id: "presence-privacy",
    category: "privacy",
    question: "Who can see when I am online or my Last Seen time?",
    answer:
      "In Settings → Privacy & Security, you can customize visibility for 'Last Seen & Online', 'Profile Picture', and 'Bio' with three granular options: Everyone, Contacts Only, or Nobody.",
    badge: "Privacy",
  },
  {
    id: "attachments-size",
    category: "messages",
    question: "What file types and size limits are allowed in chat?",
    answer:
      "Aether Chat enforces secure image-only attachments (PNG, JPG, WebP, GIF) up to 6 MB in size. Executable binaries and scripts are strictly forbidden by our file validation policy to keep your chats safe.",
    badge: "Media",
  },
  {
    id: "realtime-sync",
    category: "messages",
    question: "Are messages delivered instantly in real time?",
    answer:
      "Yes! Aether Chat uses Supabase Realtime channels with Row Level Security (RLS). Messages, read receipts, and online status update instantaneously across all connected devices.",
    badge: "Realtime",
  },
  {
    id: "phone-verification",
    category: "security",
    question: "Why should I verify my phone number?",
    answer:
      "Phone number verification links your mobile number to your account for SMS-based security recovery alerts. You can verify it under Settings → Account → Phone Verification or from your Profile edit page.",
    badge: "Verification",
  },
  {
    id: "group-roles",
    category: "basics",
    question: "How do group chats and permissions work?",
    answer:
      "Group chats support Owners and Members. Group creators have Owner privileges and can customize group details or invite additional participants. All group chats are protected by conversation membership security policies.",
    badge: "Groups",
  },
  {
    id: "desktop-mobile",
    category: "basics",
    question: "Can I use Aether Chat on mobile or install it as an app?",
    answer:
      "Aether Chat is a fully responsive Progressive Web App (PWA). You can install it directly to your home screen from Chrome or Safari on iOS and Android, or download our native Android APK from Settings → Help.",
    badge: "App",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Questions" },
  { id: "security", label: "Security & 2FA" },
  { id: "privacy", label: "Privacy & Controls" },
  { id: "messages", label: "Messaging & Media" },
  { id: "basics", label: "Getting Started" },
];

export interface FaqSectionProps {
  compact?: boolean;
  onNavigate?: (tab: "contact" | "privacy") => void;
}

export function FaqSection({ compact = false, onNavigate }: FaqSectionProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>("2fa-setup");
  const [voted, setVoted] = useState<Record<string, "up" | "down">>({});

  const filteredItems = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.badge && item.badge.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  function handleVote(faqId: string, type: "up" | "down") {
    setVoted((prev) => ({ ...prev, [faqId]: type }));
    toast.success("Thank you for your feedback!");
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-8"}>
      {compact ? (
        /* Compact In-Panel Search & Categories */
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search FAQs (e.g. 2FA, block, privacy)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-12 rounded-xl text-xs bg-card border-border/80"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Compact Category Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer shrink-0 ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Search Header Banner */
        <div className="relative rounded-3xl border bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-10 shadow-xl overflow-hidden">
          <div className="absolute -right-12 -top-12 size-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              <span>Support Knowledgebase</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              How can we assist you today?
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Find answers to common questions about your account, security settings, privacy controls, and real-time messaging.
            </p>

            {/* Search Box */}
            <div className="relative pt-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search topics (e.g. 2FA, password, block user, file limit)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-10 pr-4 rounded-2xl border-border bg-background/80 shadow-xs text-sm focus-visible:ring-primary/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Tiles for Full Page Mode Only */}
      {!compact && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/help/contact"
            className="group flex flex-col justify-between rounded-2xl border bg-card p-4 transition-all hover:border-primary/40 hover:bg-muted/40 shadow-xs"
          >
          <div className="space-y-1.5">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <Mail className="size-4" />
            </div>
            <p className="text-sm font-semibold text-foreground">Contact Support</p>
            <p className="text-xs text-muted-foreground">
              Send a message directly to our engineering team.
            </p>
          </div>
          <span className="mt-3 text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Send ticket →
          </span>
        </Link>

        <Link
          href="/help/privacy"
          className="group flex flex-col justify-between rounded-2xl border bg-card p-4 transition-all hover:border-primary/40 hover:bg-muted/40 shadow-xs"
        >
          <div className="space-y-1.5">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <ShieldCheck className="size-4" />
            </div>
            <p className="text-sm font-semibold text-foreground">Privacy Center</p>
            <p className="text-xs text-muted-foreground">
              Review data retention and download your account data.
            </p>
          </div>
          <span className="mt-3 text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            View controls →
          </span>
        </Link>

        <Link
          href="/chat"
          className="group flex flex-col justify-between rounded-2xl border bg-card p-4 transition-all hover:border-primary/40 hover:bg-muted/40 shadow-xs"
        >
          <div className="space-y-1.5">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <MessageSquare className="size-4" />
            </div>
            <p className="text-sm font-semibold text-foreground">Back to Chats</p>
            <p className="text-xs text-muted-foreground">
              Return to your conversations and direct messages.
            </p>
          </div>
          <span className="mt-3 text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Open messenger →
          </span>
        </Link>
      </div>
      )}

      {/* Category Filter Pills (Full page mode) */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border bg-card/50 p-6">
            <div className="grid size-12 place-items-center rounded-2xl bg-muted mb-3 text-muted-foreground">
              <HelpCircle className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No matching questions found</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              We couldn&apos;t find any articles matching &ldquo;{searchQuery}&rdquo;. Try another term or submit a ticket to our support team.
            </p>
            <Button asChild size="sm" className="mt-4 rounded-xl text-xs font-semibold">
              <Link href="/help/contact">Submit Support Request</Link>
            </Button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const currentVote = voted[item.id];

            return (
              <div
                key={item.id}
                className="rounded-2xl border bg-card transition-all shadow-xs overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-semibold text-sm text-foreground">
                      {item.question}
                    </span>
                    {item.badge && (
                      <span className="hidden sm:inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isExpanded ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-border/50 bg-muted/10 p-4 pt-3.5 space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
                      <span>Was this answer helpful?</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleVote(item.id, "up")}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md transition ${
                            currentVote === "up"
                              ? "bg-emerald-500/10 text-emerald-500 font-semibold"
                              : "hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <ThumbsUp className="size-3.5" />
                          <span>Yes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVote(item.id, "down")}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md transition ${
                            currentVote === "down"
                              ? "bg-rose-500/10 text-rose-500 font-semibold"
                              : "hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <ThumbsDown className="size-3.5" />
                          <span>No</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still need help footer box */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-xs font-semibold text-foreground">Still have questions?</p>
          <p className="text-[11px] text-muted-foreground">
            Our support desk is online to assist with any questions.
          </p>
        </div>
        {onNavigate ? (
          <Button
            type="button"
            onClick={() => onNavigate("contact")}
            className="rounded-xl font-semibold text-xs shrink-0 shadow-md cursor-pointer"
          >
            Contact Support
          </Button>
        ) : (
          <Button asChild className="rounded-xl font-semibold text-xs shrink-0 shadow-md">
            <Link href="/help/contact">Contact Support</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
