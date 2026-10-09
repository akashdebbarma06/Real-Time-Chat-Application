"use client";

import { useEffect, useState } from "react";
import { Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface ContactPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitContact: (contactText: string) => void;
}

export function ContactPickerDialog({
  open,
  onOpenChange,
  onSubmitContact,
}: ContactPickerDialogProps) {
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  // Custom manual contact input state
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void createClient()
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, last_seen_at")
      .limit(20)
      .then(({ data }) => {
        setContacts((data || []) as Profile[]);
        setLoading(false);
      });
  }, [open]);

  const filtered = contacts.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.display_name.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q)
    );
  });

  function shareProfile(profile: Profile) {
    const formatted = `👤 **CONTACT CARD**\n**Name:** ${profile.display_name} (@${profile.username})\n${profile.bio ? `**Bio:** ${profile.bio}\n` : ""}*Shared via Aether Chat*`;
    onSubmitContact(formatted);
    onOpenChange(false);
    toast.success(`Shared contact for ${profile.display_name}`);
  }

  function handleManualShare(e: React.FormEvent) {
    e.preventDefault();
    if (!manualName.trim()) {
      toast.error("Please enter a contact name");
      return;
    }
    const formatted = `👤 **CONTACT CARD**\n**Name:** ${manualName.trim()}${manualPhone ? `\n📞 **Phone:** ${manualPhone.trim()}` : ""}\n*Shared via Aether Chat*`;
    onSubmitContact(formatted);
    onOpenChange(false);
    setManualName("");
    setManualPhone("");
    toast.success("Contact card shared");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-500">
              <UserCheck className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Share Contact</DialogTitle>
              <p className="text-xs text-muted-foreground">Select a registered contact or share details</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-8.5 rounded-xl text-xs"
            />
          </div>

          {/* Contacts List */}
          <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1 border rounded-2xl p-1.5 bg-muted/20">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">Loading contacts...</p>
            ) : filtered.length > 0 ? (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => shareProfile(c)}
                  className="flex w-full items-center gap-2.5 p-2 rounded-xl text-left hover:bg-muted/70 transition cursor-pointer"
                >
                  <Avatar className="size-8 rounded-full border">
                    <AvatarImage src={c.avatar_url || undefined} alt={c.display_name} />
                    <AvatarFallback className="text-[10px] font-bold">
                      {getInitials(c.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{c.display_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">@{c.username}</p>
                  </div>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">Share →</span>
                </button>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No contacts found</p>
            )}
          </div>

          {/* Or Manual Details */}
          <div className="pt-2 border-t">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Or Share New Contact
            </p>
            <form onSubmit={handleManualShare} className="space-y-2">
              <Input
                placeholder="Full Name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="rounded-xl text-xs h-9"
              />
              <Input
                placeholder="Phone Number (e.g. +1 555-0199)"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                className="rounded-xl text-xs h-9"
              />
              <Button
                type="submit"
                size="sm"
                className="w-full rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-500/20 h-9"
              >
                Share Custom Contact
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
