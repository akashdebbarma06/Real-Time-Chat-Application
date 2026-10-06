"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  ChevronRight,
  Download,
  Globe,
  HelpCircle,
  Key,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  Share2,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserX,
  Volume2,
} from "lucide-react";
import { playNotificationSound, requestNotificationPermission } from "@/lib/notifications";
import { toast } from "sonner";
import { ComingSoonDialog } from "@/components/ui/coming-soon-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface SettingsViewProps {
  profile: Profile;
}

type VisibilityOption = "everyone" | "nobody" | "everyone_except";

export function SettingsView({ profile }: SettingsViewProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Coming Soon State
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState("Feature");

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
    { id: "account", icon: Shield, title: "Account", desc: "Email, passkey, password & security" },
    { id: "privacy", icon: Lock, title: "Privacy & Security", desc: "Visibility controls & blocked contacts" },
    { id: "notifications", icon: Bell, title: "Notifications", desc: "Alerts, tone & vibration" },
    { id: "language", icon: Globe, title: "Language", desc: selectedLanguage },
    { id: "help", icon: HelpCircle, title: "Help & Feedback", desc: "Help centre, contact us & policies" },
    { id: "invite", icon: Share2, title: "Invite a Friend", desc: "Share Aether Chat with friends" },
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
      <div className="space-y-2 rounded-xl border bg-muted/40 p-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`rounded-lg py-2 text-[11px] font-semibold transition-all ${
                value === opt.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
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
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Circular Avatar Profile Header */}
      <Link href="/profile" className="flex flex-col items-center gap-2 py-5 border-b border-border transition hover:bg-muted/40">
        <Avatar className="size-20 rounded-full border-2 border-primary/30 shadow-lg shadow-primary/10">
          <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
          <AvatarFallback className="rounded-full text-xl font-bold bg-primary/10 text-primary">
            {getInitials(profile.display_name)}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h3 className="text-base font-semibold text-foreground">{profile.display_name}</h3>
          <p className="text-xs text-muted-foreground">@{profile.username}</p>
        </div>
        <span className="text-xs font-semibold text-primary hover:underline transition">Edit Profile</span>
      </Link>

      {/* Settings Menu List */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 py-3">
          {settingsMenu.map((item) => {
            const Icon = item.icon;

            // Invite a Friend — special handler
            if (item.id === "invite") {
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setComingSoonFeature("Invite Friends & QR Code Sharing");
                    setComingSoonOpen(true);
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border bg-card/60 p-3.5 text-left transition-all hover:bg-muted hover:border-primary/40 shadow-xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
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
                  <button className="flex w-full items-center justify-between rounded-2xl border bg-card/60 p-3.5 text-left transition-all hover:bg-muted hover:border-primary/40 shadow-xs">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Icon className="size-5 text-primary" />
                      <span>{item.title}</span>
                    </DialogTitle>
                  </DialogHeader>

                  {/* ═══════ ACCOUNT ═══════ */}
                  {item.id === "account" && (
                    <div className="space-y-3 pt-2">
                      {/* 1. Add new account */}
                      <button
                        type="button"
                        onClick={() => toast.info("Add new account coming soon")}
                        className="flex w-full items-center gap-3 rounded-xl border bg-muted/30 p-3 hover:bg-muted transition"
                      >
                        <UserPlus className="size-5 text-primary" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">Add New Account</p>
                          <p className="text-xs text-muted-foreground">Switch between multiple accounts</p>
                        </div>
                      </button>

                      {/* 2. Email */}
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <div className="flex items-center gap-3">
                          <Mail className="size-5 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Email Address</p>
                            <p className="text-sm font-medium text-foreground truncate mt-0.5">
                              {profile.username}@aetherchat.app
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 3. Passkey */}
                      <button
                        type="button"
                        onClick={() => toast.info("Passkey setup coming soon")}
                        className="flex w-full items-center gap-3 rounded-xl border bg-muted/30 p-3 hover:bg-muted transition"
                      >
                        <Key className="size-5 text-primary" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">Passkey</p>
                          <p className="text-xs text-muted-foreground">Set up passwordless login</p>
                        </div>
                      </button>

                      {/* 4. Two-step verification */}
                      <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="size-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Two-Step Verification</p>
                            <p className="text-xs text-muted-foreground">Extra layer of account security</p>
                          </div>
                        </div>
                        <Switch checked={twoStepEnabled} onCheckedChange={setTwoStepEnabled} />
                      </div>

                      {/* 5. Change password & email */}
                      <button
                        type="button"
                        onClick={() => toast.info("Change credentials coming soon")}
                        className="flex w-full items-center gap-3 rounded-xl border bg-muted/30 p-3 hover:bg-muted transition"
                      >
                        <Lock className="size-5 text-primary" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">Change Password & Email</p>
                          <p className="text-xs text-muted-foreground">Update login credentials</p>
                        </div>
                      </button>

                      {/* 6. Delete or deactivate account */}
                      <button
                        type="button"
                        onClick={() => toast.error("Please contact support to delete your account")}
                        className="flex w-full items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 hover:bg-destructive/20 transition"
                      >
                        <Trash2 className="size-5 text-destructive" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-destructive">Delete or Deactivate Account</p>
                          <p className="text-xs text-muted-foreground">Permanently remove or pause your account</p>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* ═══════ PRIVACY & SECURITY ═══════ */}
                  {item.id === "privacy" && (
                    <div className="space-y-4 pt-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Who Can See</p>

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
                        type="button"
                        onClick={() => toast.info("No blocked contacts")}
                        className="flex w-full items-center gap-3 rounded-xl border bg-muted/30 p-3 hover:bg-muted transition"
                      >
                        <UserX className="size-5 text-destructive" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium text-foreground">Blocked Contacts</p>
                          <p className="text-xs text-muted-foreground">Manage your blocked list</p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                    </div>
                  )}

                  {/* ═══════ NOTIFICATIONS ═══════ */}
                  {item.id === "notifications" && (
                    <div className="space-y-4 pt-2">
                      {/* 1. On/Off Toggle */}
                      <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
                        <div className="flex items-center gap-3">
                          <Bell className="size-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Notifications</p>
                            <p className="text-xs text-muted-foreground">Enable or disable all alerts</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationsEnabled}
                          onCheckedChange={(checked) => {
                            setNotificationsEnabled(checked);
                            if (checked) {
                              void requestNotificationPermission();
                              playNotificationSound();
                              toast.success("Notifications enabled!");
                            } else {
                              toast.info("Notifications disabled");
                            }
                          }}
                        />
                      </div>

                      {/* 2. Notification Tone */}
                      <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <Volume2 className="size-5 text-primary" />
                          <p className="text-sm font-medium text-foreground">Notification Tone</p>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {["Default", "Chime", "Bell", "Pop", "Ping", "Silent"].map((tone) => (
                            <button
                              key={tone}
                              type="button"
                              onClick={() => {
                                setNotificationTone(tone);
                                if (tone !== "Silent") playNotificationSound();
                                toast.success(`Tone set to ${tone}`);
                              }}
                              className={`rounded-lg py-2 text-[11px] font-semibold transition-all ${
                                notificationTone === tone
                                  ? "bg-primary text-primary-foreground shadow-xs"
                                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                              }`}
                            >
                              {tone}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. Vibrate */}
                      <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
                        <div className="flex items-center gap-3">
                          <Phone className="size-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Vibrate</p>
                            <p className="text-xs text-muted-foreground">Vibrate on new messages</p>
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
                          type="button"
                          onClick={() => {
                            setSelectedLanguage(lang);
                            toast.success(`Language set to ${lang}`);
                            setSelectedSection(null);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                            selectedLanguage === lang
                              ? "border-primary/50 bg-primary/10 text-primary"
                              : "border-border hover:bg-muted text-foreground"
                          }`}
                        >
                          <span className="text-sm font-medium">{lang}</span>
                          {selectedLanguage === lang && <Check className="size-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ═══════ HELP & FEEDBACK ═══════ */}
                  {item.id === "help" && (
                    <div className="space-y-3 pt-2">
                      {/* Help Centre */}
                      <button
                        type="button"
                        onClick={() => toast.info("Help Centre coming soon")}
                        className="flex w-full items-center gap-3 rounded-xl border bg-muted/30 p-3 hover:bg-muted transition"
                      >
                        <HelpCircle className="size-5 text-primary" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium text-foreground">Help Centre</p>
                          <p className="text-xs text-muted-foreground">Browse FAQs & support articles</p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>

                      {/* Contact Us */}
                      <Link
                        href="/contact"
                        className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3 hover:bg-muted transition"
                      >
                        <MessageSquare className="size-5 text-primary" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium text-foreground">Contact Us</p>
                          <p className="text-xs text-muted-foreground">Reach our support team directly</p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </Link>

                      {/* Privacy Policy */}
                      <Link
                        href="/privacy"
                        className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3 hover:bg-muted transition"
                      >
                        <Shield className="size-5 text-primary" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium text-foreground">Privacy Policy</p>
                          <p className="text-xs text-muted-foreground">Data protection & usage terms</p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </Link>

                      {/* Download Android APK */}
                      <a
                        href="/downloads/AetherChat.apk"
                        download="AetherChat.apk"
                        className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3 hover:bg-primary/20 transition"
                      >
                        <Download className="size-5 text-primary" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium text-primary">Download Android App</p>
                          <p className="text-xs text-muted-foreground">Native signed APK for Android</p>
                        </div>
                        <ChevronRight className="size-4 text-primary" />
                      </a>
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

      <ComingSoonDialog
        open={comingSoonOpen}
        onOpenChange={setComingSoonOpen}
        featureName={comingSoonFeature}
      />
    </div>
  );
}
