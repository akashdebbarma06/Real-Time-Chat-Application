"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  ChevronRight,
  Copy,
  Globe,
  HelpCircle,
  Key,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Share2,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  UserMinus,
  UserPlus,
  UserX,
  Vibrate,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface SettingsViewProps {
  profile: Profile;
}

type VisibilityOption = "everyone" | "nobody" | "everyone_except";

export function SettingsView({ profile }: SettingsViewProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Privacy state
  const [lastSeenVisibility, setLastSeenVisibility] = useState<VisibilityOption>("everyone");
  const [profilePicVisibility, setProfilePicVisibility] = useState<VisibilityOption>("everyone");
  const [bioVisibility, setBioVisibility] = useState<VisibilityOption>("everyone");

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationTone, setNotificationTone] = useState("Default");
  const [vibrateEnabled, setVibrateEnabled] = useState(true);

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  // Two-step verification
  const [twoStepEnabled, setTwoStepEnabled] = useState(false);

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

  const settingsMenu = [
    { id: "profile", icon: User, title: "Profile", desc: "Avatar, bio, username & links", href: "/profile" },
    { id: "account", icon: Shield, title: "Account", desc: "Email, passkey, password & security" },
    { id: "privacy", icon: Lock, title: "Privacy & Security", desc: "Visibility controls & blocked contacts" },
    { id: "notifications", icon: Bell, title: "Notifications", desc: "Alerts, tone & vibration" },
    { id: "language", icon: Globe, title: "Language", desc: selectedLanguage },
    { id: "help", icon: HelpCircle, title: "Help & Feedback", desc: "Help centre, contact us & policies" },
    { id: "invite", icon: Share2, title: "Invite a Friend", desc: "Share ChatSphere with friends" },
  ];

  function VisibilitySelector({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: VisibilityOption;
    onChange: (v: VisibilityOption) => void;
  }) {
    const options: { id: VisibilityOption; label: string }[] = [
      { id: "everyone", label: "Everyone" },
      { id: "nobody", label: "Nobody" },
      { id: "everyone_except", label: "Everyone Except..." },
    ];
    return (
      <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`rounded-lg py-2 text-[11px] font-semibold transition-all ${
                value === opt.id
                  ? "bg-cyan-500 text-slate-950 shadow-sm"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

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
            <Avatar className="size-12 rounded-full border border-slate-700 shadow-sm">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
              <AvatarFallback className="rounded-full">{getInitials(profile.display_name)}</AvatarFallback>
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

      {/* Settings Menu List */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 py-2">
          {settingsMenu.map((item) => {
            const Icon = item.icon;

            // Profile links directly to /profile page
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

            // Invite a Friend — special handler
            if (item.id === "invite") {
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    const shareUrl = "https://chatsphere-tan.vercel.app";
                    if (navigator.share) {
                      void navigator.share({ title: "ChatSphere", text: "Chat with me on ChatSphere!", url: shareUrl });
                    } else {
                      void navigator.clipboard.writeText(shareUrl);
                      toast.success("Link copied to clipboard!");
                    }
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 text-left transition-all hover:bg-slate-800/80 hover:border-cyan-500/50"
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
                </button>
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

                  {/* ═══════ ACCOUNT ═══════ */}
                  {item.id === "account" && (
                    <div className="space-y-3 pt-2">
                      {/* 1. Add new account */}
                      <button
                        onClick={() => toast.info("Add new account coming soon")}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 hover:bg-slate-800 transition"
                      >
                        <UserPlus className="size-5 text-cyan-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium">Add New Account</p>
                          <p className="text-xs text-slate-400">Switch between multiple accounts</p>
                        </div>
                      </button>

                      {/* 2. Email */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <div className="flex items-center gap-3">
                          <Mail className="size-5 text-cyan-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-400">Email Address</p>
                            <p className="text-sm font-medium truncate mt-0.5">
                              {profile.username}@chatsphere.app
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 3. Passkey */}
                      <button
                        onClick={() => toast.info("Passkey setup coming soon")}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 hover:bg-slate-800 transition"
                      >
                        <Key className="size-5 text-cyan-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium">Passkey</p>
                          <p className="text-xs text-slate-400">Set up passwordless login</p>
                        </div>
                      </button>

                      {/* 4. Two-step verification */}
                      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="size-5 text-cyan-400" />
                          <div>
                            <p className="text-sm font-medium">Two-Step Verification</p>
                            <p className="text-xs text-slate-400">Extra layer of account security</p>
                          </div>
                        </div>
                        <Switch checked={twoStepEnabled} onCheckedChange={setTwoStepEnabled} />
                      </div>

                      {/* 5. Change password & email */}
                      <button
                        onClick={() => toast.info("Change credentials coming soon")}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 hover:bg-slate-800 transition"
                      >
                        <Lock className="size-5 text-cyan-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium">Change Password & Email</p>
                          <p className="text-xs text-slate-400">Update login credentials</p>
                        </div>
                      </button>

                      {/* 6. Delete or deactivate account */}
                      <button
                        onClick={() => toast.error("Please contact support to delete your account")}
                        className="flex w-full items-center gap-3 rounded-xl border border-rose-900/50 bg-rose-950/30 p-3 hover:bg-rose-950/50 transition"
                      >
                        <Trash2 className="size-5 text-rose-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-rose-400">Delete or Deactivate Account</p>
                          <p className="text-xs text-slate-400">Permanently remove or pause your account</p>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* ═══════ PRIVACY & SECURITY ═══════ */}
                  {item.id === "privacy" && (
                    <div className="space-y-4 pt-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Who Can See</p>

                      {/* 1. Last Seen & Online */}
                      <VisibilitySelector
                        label="Last Seen & Online"
                        value={lastSeenVisibility}
                        onChange={setLastSeenVisibility}
                      />

                      {/* 2. Profile Picture */}
                      <VisibilitySelector
                        label="Profile Picture"
                        value={profilePicVisibility}
                        onChange={setProfilePicVisibility}
                      />

                      {/* 3. Bio */}
                      <VisibilitySelector
                        label="Bio"
                        value={bioVisibility}
                        onChange={setBioVisibility}
                      />

                      {/* 4. Blocked Contacts */}
                      <button
                        onClick={() => toast.info("No blocked contacts")}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 hover:bg-slate-800 transition"
                      >
                        <UserX className="size-5 text-rose-400" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium">Blocked Contacts</p>
                          <p className="text-xs text-slate-400">Manage your blocked list</p>
                        </div>
                        <ChevronRight className="size-4 text-slate-500" />
                      </button>
                    </div>
                  )}

                  {/* ═══════ NOTIFICATIONS ═══════ */}
                  {item.id === "notifications" && (
                    <div className="space-y-4 pt-2">
                      {/* 1. On/Off Toggle */}
                      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <div className="flex items-center gap-3">
                          <Bell className="size-5 text-cyan-400" />
                          <div>
                            <p className="text-sm font-medium">Notifications</p>
                            <p className="text-xs text-slate-400">Enable or disable all alerts</p>
                          </div>
                        </div>
                        <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                      </div>

                      {/* 2. Notification Tone */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <Volume2 className="size-5 text-cyan-400" />
                          <p className="text-sm font-medium">Notification Tone</p>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {["Default", "Chime", "Bell", "Pop", "Ping", "Silent"].map((tone) => (
                            <button
                              key={tone}
                              onClick={() => {
                                setNotificationTone(tone);
                                toast.success(`Tone set to ${tone}`);
                              }}
                              className={`rounded-lg py-2 text-[11px] font-semibold transition-all ${
                                notificationTone === tone
                                  ? "bg-cyan-500 text-slate-950 shadow-sm"
                                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                              }`}
                            >
                              {tone}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. Vibrate */}
                      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <div className="flex items-center gap-3">
                          <Phone className="size-5 text-cyan-400" />
                          <div>
                            <p className="text-sm font-medium">Vibrate</p>
                            <p className="text-xs text-slate-400">Vibrate on new messages</p>
                          </div>
                        </div>
                        <Switch checked={vibrateEnabled} onCheckedChange={setVibrateEnabled} />
                      </div>
                    </div>
                  )}

                  {/* ═══════ LANGUAGE ═══════ */}
                  {item.id === "language" && (
                    <div className="space-y-2 pt-2">
                      {[
                        "English",
                        "Hindi",
                        "Spanish",
                        "French",
                        "German",
                        "Portuguese",
                        "Arabic",
                        "Chinese",
                        "Japanese",
                        "Korean",
                        "Bengali",
                        "Tamil",
                        "Telugu",
                      ].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setSelectedLanguage(lang);
                            toast.success(`Language set to ${lang}`);
                            setSelectedSection(null);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                            selectedLanguage === lang
                              ? "border-cyan-500/50 bg-cyan-500/10"
                              : "border-slate-800 hover:bg-slate-800"
                          }`}
                        >
                          <span className="text-sm font-medium">{lang}</span>
                          {selectedLanguage === lang && <Check className="size-4 text-cyan-400" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ═══════ HELP & FEEDBACK ═══════ */}
                  {item.id === "help" && (
                    <div className="space-y-3 pt-2">
                      {/* Help Centre */}
                      <button
                        onClick={() => toast.info("Help Centre coming soon")}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 hover:bg-slate-800 transition"
                      >
                        <HelpCircle className="size-5 text-cyan-400" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium">Help Centre</p>
                          <p className="text-xs text-slate-400">Browse FAQs & support articles</p>
                        </div>
                        <ChevronRight className="size-4 text-slate-500" />
                      </button>

                      {/* Contact Us */}
                      <Link
                        href="/contact"
                        className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 hover:bg-slate-800 transition"
                      >
                        <MessageSquare className="size-5 text-cyan-400" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium">Contact Us</p>
                          <p className="text-xs text-slate-400">Reach our support team directly</p>
                        </div>
                        <ChevronRight className="size-4 text-slate-500" />
                      </Link>

                      {/* Privacy Policy */}
                      <Link
                        href="/privacy"
                        className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 hover:bg-slate-800 transition"
                      >
                        <Shield className="size-5 text-cyan-400" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium">Privacy Policy</p>
                          <p className="text-xs text-slate-400">Data protection & usage terms</p>
                        </div>
                        <ChevronRight className="size-4 text-slate-500" />
                      </Link>
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
