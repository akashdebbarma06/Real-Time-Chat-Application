import type { Metadata } from "next";
import { Mail, MessageSquare, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Aether Chat team for support, feedback, or inquiries.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 text-slate-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Contact Us</h1>
        <p className="mt-2 text-base text-slate-400 max-w-xl mx-auto">
          Have a question, feedback, or need technical support? We would love to hear from you.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-400">
                <Mail className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-100">Email Support</h3>
                <p className="text-sm text-slate-400">support@aetherchat.app</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-400">
                <MessageSquare className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-100">Community & Feedback</h3>
                <p className="text-sm text-slate-400">github.com/akashdebbarma06</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-400">
                <MapPin className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-100">Project Origin</h3>
                <p className="text-sm text-slate-400">Aether Open-Source Project</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <form className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
          <h3 className="text-lg font-bold text-slate-100 mb-2">Send a Message</h3>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-300">Your Name</label>
            <Input required placeholder="Your name" className="border-slate-800 bg-slate-950 text-slate-100 rounded-xl" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-300">Email Address</label>
            <Input required type="email" placeholder="you@example.com" className="border-slate-800 bg-slate-950 text-slate-100 rounded-xl" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-300">Message</label>
            <Textarea required rows={4} placeholder="How can we help you?" className="border-slate-800 bg-slate-950 text-slate-100 rounded-xl" />
          </div>
          <Button type="submit" className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20">
            Send Message
          </Button>
        </form>
      </div>
    </div>
  );
}
