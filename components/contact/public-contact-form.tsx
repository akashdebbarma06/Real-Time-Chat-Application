"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function PublicContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTicket, setSuccessTicket] = useState<{ id: string; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validation
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Please enter your name (minimum 2 characters).");
      return;
    }
    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setErrorMessage("Message must be at least 10 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || undefined,
          message: message.trim(),
          honeypot: honeypot.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Unable to send your message. Please try again later.");
        setLoading(false);
        return;
      }

      setSuccessTicket({
        id: data.ticketId || "AETH-REF",
        message: data.message || "Your message has been successfully received.",
      });
      setLoading(false);
    } catch {
      setErrorMessage("Network error occurred while submitting. Please verify your connection or use GitHub Issues.");
      setLoading(false);
    }
  }

  function handleReset() {
    setSuccessTicket(null);
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setHoneypot("");
    setErrorMessage(null);
  }

  if (successTicket) {
    return (
      <div
        className="rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-8 shadow-xl text-center space-y-5"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-cyan-500/20 text-cyan-400 shadow-md">
          <CheckCircle2 className="size-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-100">Inquiry Received</h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {successTicket.message}
          </p>
        </div>
        <div className="inline-block rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-3 text-xs font-mono text-cyan-300">
          Tracking ID: <span className="font-bold text-cyan-400">{successTicket.id}</span>
        </div>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Please retain this reference number for any follow-up communications.
        </p>
        <div className="pt-2">
          <Button
            onClick={handleReset}
            variant="outline"
            className="rounded-xl border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold"
          >
            Send Another Message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-xl backdrop-blur-md"
      aria-label="Public Contact Form"
    >
      <h3 className="text-lg font-bold text-slate-100 mb-1">Send a Message</h3>
      <p className="text-xs text-slate-400 mb-4">
        All fields marked with an asterisk (<span className="text-cyan-400">*</span>) are required.
      </p>

      {errorMessage && (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Honeypot field (hidden from screen readers and sighted users) */}
      <div style={{ display: "none" }} aria-hidden="true">
        <label htmlFor="contact-honeypot">Leave this field blank</label>
        <input
          id="contact-honeypot"
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="contact-name" className="text-xs font-medium text-slate-300">
          Your Name <span className="text-cyan-400">*</span>
        </label>
        <Input
          id="contact-name"
          name="name"
          required
          disabled={loading}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex Morgan"
          maxLength={100}
          className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-cyan-500"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="contact-email" className="text-xs font-medium text-slate-300">
          Email Address <span className="text-cyan-400">*</span>
        </label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          required
          disabled={loading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alex@example.com"
          maxLength={254}
          className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-cyan-500"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="contact-subject" className="text-xs font-medium text-slate-300">
          Subject <span className="text-slate-500 text-[11px]">(Optional)</span>
        </label>
        <Input
          id="contact-subject"
          name="subject"
          disabled={loading}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary of inquiry"
          maxLength={150}
          className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-cyan-500"
        />
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="contact-message" className="text-xs font-medium text-slate-300">
            Message <span className="text-cyan-400">*</span>
          </label>
          <span className="text-[11px] text-slate-500">
            {message.length}/3000
          </span>
        </div>
        <Textarea
          id="contact-message"
          name="message"
          required
          disabled={loading}
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your inquiry, issue, or feedback in detail (min 10 characters)..."
          maxLength={3000}
          className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-cyan-500 resize-y"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 h-10 gap-2 transition"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Sending Message...</span>
          </>
        ) : (
          <>
            <Send className="size-4" />
            <span>Send Message</span>
          </>
        )}
      </Button>

      <p className="text-center text-[11px] text-slate-400 pt-1">
        Your submission is protected with rate limiting and processed securely according to our Privacy Policy.
      </p>
    </form>
  );
}
