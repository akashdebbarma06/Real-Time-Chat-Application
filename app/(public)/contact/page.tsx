import type { Metadata } from "next";
import { Mail, MessageSquare, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the ChatSphere team for support, feedback, or inquiries.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact Us</h1>
        <p className="mt-2 text-base text-muted-foreground max-w-xl mx-auto">
          Have a question, feedback, or need technical support? We would love to hear from you.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">Email Support</h3>
                <p className="text-sm text-muted-foreground">support@chatsphere.app</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">Community & Feedback</h3>
                <p className="text-sm text-muted-foreground">github.com/akashdebbarma06</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">Project Origin</h3>
                <p className="text-sm text-muted-foreground">Open-Source Project</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <form className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Send a Message</h3>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Your Name</label>
            <Input required placeholder="Your name" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input required type="email" placeholder="you@example.com" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea required rows={4} placeholder="How can we help you?" />
          </div>
          <Button type="submit" className="w-full">
            Send Message
          </Button>
        </form>
      </div>
    </div>
  );
}
