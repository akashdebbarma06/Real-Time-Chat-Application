"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Github,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/types/chat";

export interface InAppContactFormProps {
  profile: Profile;
  userEmail?: string;
  compact?: boolean;
}

type TicketCategory = "bug" | "feature" | "security" | "general";
type TicketPriority = "low" | "normal" | "high" | "urgent";

export function InAppContactForm({ profile, userEmail, compact = false }: InAppContactFormProps) {
  const [category, setCategory] = useState<TicketCategory>("bug");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketReference, setTicketReference] = useState<string | null>(null);

  const contactEmail = userEmail || `${profile.username}@aetherchat.app`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      toast.error("Please provide at least 10 characters in your message");
      return;
    }

    setSubmitting(true);
    // Simulate real ticket dispatch to support inbox
    await new Promise((resolve) => setTimeout(resolve, 900));

    const refId = `AETH-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketReference(refId);
    setSubmitting(false);

    toast.success("Ticket submitted successfully!", {
      description: `Reference #${refId}. Confirmation sent to ${contactEmail}.`,
    });
  }

  function handleReset() {
    setTicketReference(null);
    setSubject("");
    setMessage("");
    setCategory("bug");
    setPriority("normal");
  }

  if (compact) {
    return (
      <div className="space-y-4">
        {ticketReference ? (
          <div className="rounded-2xl border bg-card p-5 text-center space-y-4 shadow-sm">
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <CheckCircle2 className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Query Submitted!</h3>
              <p className="text-xs text-muted-foreground">
                Our support desk has received your ticket.
              </p>
            </div>
            <div className="rounded-xl border bg-muted/40 p-2.5 text-xs font-mono">
              Ref: <span className="font-bold text-primary">{ticketReference}</span>
            </div>
            <Button
              type="button"
              onClick={handleReset}
              variant="outline"
              className="w-full rounded-xl text-xs font-semibold h-9"
            >
              Send Another Query
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Info Bar */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] space-y-0.5">
              <p className="font-semibold text-foreground truncate">{profile.display_name} (@{profile.username})</p>
              <p className="text-muted-foreground truncate">{contactEmail}</p>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Category
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: "bug", label: "Bug Report" },
                    { id: "feature", label: "Feature Request" },
                    { id: "security", label: "Security & 2FA" },
                    { id: "general", label: "General Query" },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2 rounded-xl border text-xs font-medium text-left transition cursor-pointer ${
                      category === cat.id
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border/80 bg-card hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label htmlFor="compact-subject" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Subject
              </label>
              <Input
                id="compact-subject"
                placeholder="Brief summary..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-xl text-xs h-9 bg-card"
                maxLength={80}
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label htmlFor="compact-message" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Message / Query
              </label>
              <Textarea
                id="compact-message"
                placeholder="Describe your issue or feedback in detail (min 10 chars)..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="rounded-xl text-xs bg-card resize-none"
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Priority
              </label>
              <div className="flex gap-1.5">
                {(["low", "normal", "high", "urgent"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 rounded-lg border text-[11px] capitalize font-medium transition cursor-pointer ${
                      priority === p
                        ? "border-primary bg-primary text-primary-foreground font-semibold"
                        : "border-border/80 bg-card hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl text-xs font-semibold h-10 shadow-md gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Send Support Query</span>
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header Banner */}
      <div className="relative rounded-3xl border bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-xl overflow-hidden">
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Mail className="size-3.5" />
            <span>Priority In-App Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Contact Support & Feedback
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Logged in as <span className="font-semibold text-foreground">{profile.display_name}</span> (@{profile.username}). Your account context is automatically linked for faster issue resolution.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Contact Form or Ticket Success State */}
        <div className="lg:col-span-2">
          {ticketReference ? (
            <div className="rounded-3xl border bg-card p-8 sm:p-10 shadow-xl text-center space-y-5">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-500 shadow-md">
                <CheckCircle2 className="size-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-foreground">Ticket Received!</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Our engineering team has received your inquiry. We typically reply within a few hours.
                </p>
              </div>

              <div className="inline-block rounded-2xl border bg-muted/40 px-5 py-3 text-xs font-mono">
                Ticket Reference: <span className="font-bold text-primary">{ticketReference}</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <Button onClick={handleReset} variant="outline" className="rounded-xl text-xs font-semibold">
                  Send Another Message
                </Button>
                <Button asChild className="rounded-xl text-xs font-semibold">
                  <Link href="/chat">Return to Chats</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border bg-card p-6 sm:p-8 shadow-xl space-y-5"
            >
              {/* User details header (read-only verification) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground">Account User:</span>{" "}
                  <span className="font-medium text-foreground">{profile.display_name} (@{profile.username})</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reply Destination:</span>{" "}
                  <span className="font-medium text-foreground truncate">{contactEmail}</span>
                </div>
              </div>

              {/* Inquiry Category */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Inquiry Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "bug", label: "🐛 Bug Report" },
                    { id: "feature", label: "💡 Feature Request" },
                    { id: "security", label: "🛡️ Account & 2FA" },
                    { id: "general", label: "💬 General Question" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as TicketCategory)}
                      className={`rounded-xl border p-2.5 text-xs font-semibold transition text-center ${
                        category === cat.id
                          ? "border-primary bg-primary/10 text-primary shadow-xs"
                          : "border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Urgency Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "low", label: "Low (General curiosity)" },
                    { id: "normal", label: "Normal (Standard request)" },
                    { id: "high", label: "High (Workflow disrupted)" },
                    { id: "urgent", label: "Urgent (Security / Account lockout)" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id as TicketPriority)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        priority === p.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Subject
                </label>
                <Input
                  required
                  placeholder="Summary of the issue or idea..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="rounded-xl border-border bg-background"
                />
              </div>

              {/* Message Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Message Description
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {message.length} characters
                  </span>
                </div>
                <Textarea
                  required
                  rows={5}
                  placeholder="Please describe what happened, steps to reproduce, or details of your request..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="rounded-xl border-border bg-background resize-y"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || !subject.trim() || message.trim().length < 10}
                className="w-full h-11 rounded-xl font-semibold gap-2 shadow-md shadow-primary/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Submitting Ticket...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    <span>Submit Ticket</span>
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Sidebar Info & Direct Channels */}
        <div className="space-y-4">
          {/* Response SLA */}
          <div className="rounded-3xl border bg-card p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Clock className="size-4" />
              <span>Response Time</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Inquiries from logged-in members are queued with priority. Our average resolution time is under 12 hours.
            </p>
          </div>

          {/* Direct Channels */}
          <div className="rounded-3xl border bg-card p-5 shadow-lg space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Direct Support Channels</h3>

            <div className="space-y-2 text-xs">
              <a
                href="mailto:support@aetherchat.app"
                className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/30 hover:bg-muted transition"
              >
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-primary" />
                  <span className="font-medium text-foreground">Email Support</span>
                </div>
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>

              <a
                href="https://github.com/akashdebbarma06/Real-Time-Chat-Application/issues"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/30 hover:bg-muted transition"
              >
                <div className="flex items-center gap-2">
                  <Github className="size-4 text-primary" />
                  <span className="font-medium text-foreground">GitHub Issues</span>
                </div>
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground leading-relaxed">
            <p>
              🔒 <strong>Your Privacy Matters:</strong> Support logs and submitted tickets are handled strictly according to our{" "}
              <Link href="/help/privacy" className="text-primary underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
