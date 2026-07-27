"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  ChevronRight,
  Globe,
  HelpCircle,
  Laptop,
  Lock,
  LogOut,
  Moon,
  Palette,
  Shield,
  ShieldAlert,
  Smartphone,
  Sun,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface SettingsViewProps {
  profile: Profile;
}

export function SettingsView({ profile }: SettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Settings State Flags
  const [readReceipts, setReadReceipts] = useState(true);
  const [onlinePresence, setOnlinePresence] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  async function logout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch("/auth/signout", { method: "POST" });
    } catch {
      // Ignore network errors
    }
    window.location.href = "/login";
  }

  // Numbered Settings Menu matching prototype
  const settingsMenu = [
    { id: "profile", icon: User, title: "1. Profile", desc: "Avatar, display name, bio & social links", href: "/profile" },
    { id: "account", icon: Shield, title: "2. Account", desc: "Email, security & credentials" },
    { id: "privacy", icon: Lock, title: "3. Privacy & Security", desc: "Last seen, read receipts & status" },
    { id: "notifications", icon: Bell, title: "4. Notifications", desc: "Alerts, sound & badges" },
    { id: "language", icon: Globe, title: "5. Language", desc: selectedLanguage },
    { id: "privacy_policy", icon: ShieldAlert, title: "6. Privacy Policy", desc: "Data protection policy", href: "/privacy" },
    { id: "help", icon: HelpCircle, title: "7. Contacts & Help Center", desc: "Support, FAQs & contact team" },
  ];

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      {/* Settings Title Header */}
      <div className="border-b border-slate-800 p-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-100">Settings</h2>
      </div>

      {/* User Card */}
      <div className="p-3">
        <Link
          href="/profile"
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 transition-all hover:bg-slate-800/80"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="size-12 border border-slate-700 shadow-sm">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
              <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-slate-100">{profile.display_name}</h3>
              <p className="truncate text-xs text-slate-400">@{profile.username}</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" className="rounded-full text-xs shrink-0 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30">
            Edit
          </Button>
        </Link>
      </div>

      {/* Numbered Settings Options List */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 py-2">
          {settingsMenu.map((item) => {
            const Icon = item.icon;
            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 transition-all hover:bg-slate-800/80 hover:border-cyan-500/50"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="grid size-10 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-100">{item.title}</p>
                      <p className="truncate text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-slate-500 shrink-0" />
                </Link>
              );
            }

            return (
              <Dialog
                key={item.id}
                open={selectedSection === item.id}
                onOpenChange={(open) => setSelectedSection(open ? item.id : null)}
              >
                <DialogTrigger asChild>
                  <button className="flex w-full items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 text-left transition-all hover:bg-slate-800/80 hover:border-cyan-500/50">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="grid size-10 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">{item.title}</p>
                        <p className="truncate text-xs text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-slate-500 shrink-0" />
                  </button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Icon className="size-5 text-cyan-400" />
                      <span>{item.title}</span>
                    </DialogTitle>
                  </DialogHeader>

                  {/* Account */}
                  {item.id === "account" && (
                    <div className="space-y-3 pt-2">
                      <div className="rounded-xl border border-slate-800 p-3 bg-slate-950">
                        <p className="text-xs text-slate-400">Username</p>
                        <p className="text-sm font-medium mt-0.5 text-slate-200">@{profile.username}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 p-3 bg-slate-950">
                        <p className="text-xs text-slate-400">Account Status</p>
                        <p className="text-sm font-medium text-emerald-400 mt-0.5">Active & Verified</p>
                      </div>
                    </div>
                  )}

                  {/* Privacy */}
                  {item.id === "privacy" && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between rounded-xl border border-slate-800 p-3 bg-slate-950">
                        <div>
                          <p className="text-sm font-medium">Read Receipts</p>
                          <p className="text-xs text-slate-400">Show when you have read messages</p>
                        </div>
                        <Switch checked={readReceipts} onCheckedChange={setReadReceipts} />
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-slate-800 p-3 bg-slate-950">
                        <div>
                          <p className="text-sm font-medium">Online Status</p>
                          <p className="text-xs text-slate-400">Show green online dot to friends</p>
                        </div>
                        <Switch checked={onlinePresence} onCheckedChange={setOnlinePresence} />
                      </div>
                    </div>
                  )}

                  {/* Notifications */}
                  {item.id === "notifications" && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between rounded-xl border border-slate-800 p-3 bg-slate-950">
                        <div>
                          <p className="text-sm font-medium">Message Notifications</p>
                          <p className="text-xs text-slate-400">Receive push & in-app alerts</p>
                        </div>
                        <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-slate-800 p-3 bg-slate-950">
                        <div>
                          <p className="text-sm font-medium">Notification Sounds</p>
                          <p className="text-xs text-slate-400">Play sound when messages arrive</p>
                        </div>
                        <Switch checked={notificationSound} onCheckedChange={setNotificationSound} />
                      </div>
                    </div>
                  )}

                  {/* Language */}
                  {item.id === "language" && (
                    <div className="space-y-2 pt-2">
                      {["English", "Spanish", "French", "German", "Hindi"].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setSelectedLanguage(lang);
                            toast.success(`Language set to ${lang}`);
                            setSelectedSection(null);
                          }}
                          className="flex w-full items-center justify-between rounded-xl border border-slate-800 p-3 text-left hover:bg-slate-800"
                        >
                          <span className="text-sm font-medium">{lang}</span>
                          {selectedLanguage === lang && <Check className="size-4 text-cyan-400" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Help Center */}
                  {item.id === "help" && (
                    <div className="space-y-3 pt-2">
                      <p className="text-sm text-slate-400">
                        Need assistance or have feedback? Get in touch with our support team.
                      </p>
                      <Button asChild className="w-full bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400">
                        <Link href="/contact">Contact Support</Link>
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </ScrollArea>

      {/* Logout Button */}
      <div className="p-3">
        <Button
          variant="destructive"
          size="lg"
          onClick={() => void logout()}
          className="w-full flex items-center justify-center gap-2 rounded-2xl text-xs font-bold shadow-md"
        >
          <LogOut className="size-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
