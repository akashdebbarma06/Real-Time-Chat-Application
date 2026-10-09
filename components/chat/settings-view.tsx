"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
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
  Palette,
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
import { ChangePasswordDialog } from "@/components/settings/change-password-dialog";
import { ChangeEmailDialog } from "@/components/settings/change-email-dialog";
import { BlockedContactsDialog } from "@/components/settings/blocked-contacts-dialog";
import { TwoFactorDialog } from "@/components/settings/two-factor-dialog";
import { PhoneVerificationDialog } from "@/components/settings/phone-verification-dialog";
import { AppearancePanel } from "@/components/settings/appearance-panel";
import { FaqSection } from "@/components/help/faq-section";
import { InAppContactForm } from "@/components/help/in-app-contact-form";
import { InAppPrivacyView } from "@/components/help/in-app-privacy-view";
import { useAppearance } from "@/lib/appearance-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

interface SettingsViewProps {
  profile: Profile;
}

type VisibilityOption = "everyone" | "contacts" | "nobody";

export function SettingsView({ profile }: SettingsViewProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Coming Soon State
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState("Feature");

  // Security Sub-Dialog States
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [blockedContactsOpen, setBlockedContactsOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [phoneVerificationOpen, setPhoneVerificationOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  const { preferences } = useAppearance();

  useEffect(() => {
    async function loadAuth() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setAuthEmail(data.user.email);
      }
    }
    void loadAuth();
  }, []);

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
    {
      id: "appearance",
      icon: Palette,
      title: "Appearance",
      desc: `${preferences.accentColor.charAt(0).toUpperCase() + preferences.accentColor.slice(1)} · ${preferences.bubbleStyle} bubbles · ${preferences.chatBackground} bg`,
    },
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
      { id: "contacts", label: "Contacts" },
      { id: "nobody", label: "Nobody" },
    ];
    return (
      <div className="space-y-2 rounded-2xl border bg-muted/40 p-3">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`rounded-xl py-2 text-[11px] font-semibold transition-all cursor-pointer ${
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

  // ═══════════ IN-PANEL SUB-VIEWS ═══════════

  // 1. Appearance Sub-panel
  if (selectedSection === "appearance") {
    return <AppearancePanel onBack={() => setSelectedSection(null)} />;
  }

  // 2. Account Sub-panel
  if (selectedSection === "account") {
    return (
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedSection(null)}
            className="rounded-xl size-8 shrink-0 hover:bg-muted"
            aria-label="Back to settings"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Account</h3>
            <p className="text-[11px] text-muted-foreground truncate">Security, email & credentials</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-3">
          {/* Add new account */}
          <button
            type="button"
            onClick={() => toast.info("Add new account coming soon")}
            className="flex w-full items-center gap-3 rounded-2xl border bg-card/60 p-3 hover:bg-muted transition text-left cursor-pointer"
          >
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
              <UserPlus className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground">Add New Account</p>
              <p className="text-[11px] text-muted-foreground">Switch between multiple accounts</p>
            </div>
          </button>

          {/* Email Address */}
          <div className="flex items-center justify-between rounded-2xl border bg-card/60 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Mail className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">Email Address</p>
                <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                  {authEmail || `${profile.username}@aetherchat.app`}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setChangeEmailOpen(true)}
              className="h-7 text-xs font-semibold text-primary hover:bg-primary/10 rounded-xl"
            >
              Change
            </Button>
          </div>

          {/* Phone Verification */}
          <button
            type="button"
            onClick={() => setPhoneVerificationOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl border bg-card/60 p-3 hover:bg-muted transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Phone className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Phone Verification</p>
                <p className="text-[11px] text-muted-foreground">Verify SMS authentication</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>

          {/* Two-step verification */}
          <div className="flex items-center justify-between rounded-2xl border bg-card/60 p-3">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Two-Step Verification</p>
                <p className="text-[11px] text-muted-foreground">
                  {twoStepEnabled ? "Active (Authenticator app)" : "Extra account security"}
                </p>
              </div>
            </div>
            <Switch
              checked={twoStepEnabled}
              onCheckedChange={() => setTwoFactorOpen(true)}
            />
          </div>

          {/* Change password */}
          <button
            type="button"
            onClick={() => setChangePasswordOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl border bg-card/60 p-3 hover:bg-muted transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Lock className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Change Password</p>
                <p className="text-[11px] text-muted-foreground">Update account password</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>

          {/* Delete or deactivate */}
          <button
            type="button"
            onClick={() => toast.error("Please contact support to delete your account")}
            className="flex w-full items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 hover:bg-destructive/20 transition text-left cursor-pointer"
          >
            <div className="grid size-9 place-items-center rounded-xl bg-destructive/20 text-destructive shrink-0">
              <Trash2 className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-destructive">Delete Account</p>
              <p className="text-[11px] text-muted-foreground">Permanently remove your account</p>
            </div>
          </button>
        </div>

        {/* Child Dialogs for Account */}
        <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
        <ChangeEmailDialog open={changeEmailOpen} onOpenChange={setChangeEmailOpen} currentEmail={authEmail || undefined} />
        <TwoFactorDialog open={twoFactorOpen} onOpenChange={setTwoFactorOpen} isEnabled={twoStepEnabled} onStatusChange={setTwoStepEnabled} />
        <PhoneVerificationDialog open={phoneVerificationOpen} onOpenChange={setPhoneVerificationOpen} />
      </div>
    );
  }

  // 3. Privacy Sub-panel
  if (selectedSection === "privacy") {
    return (
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedSection(null)}
            className="rounded-xl size-8 shrink-0 hover:bg-muted"
            aria-label="Back to settings"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Privacy & Security</h3>
            <p className="text-[11px] text-muted-foreground truncate">Visibility controls & blocked users</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-4">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Who Can See</p>

          <VisibilitySelector label="Last Seen & Online" value={lastSeenVisibility} onChange={setLastSeenVisibility} />
          <VisibilitySelector label="Profile Picture" value={profilePicVisibility} onChange={setProfilePicVisibility} />
          <VisibilitySelector label="Bio & About" value={bioVisibility} onChange={setBioVisibility} />

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setBlockedContactsOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl border bg-card/60 p-3 hover:bg-muted transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-destructive/10 text-destructive shrink-0">
                  <UserX className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Blocked Contacts</p>
                  <p className="text-[11px] text-muted-foreground">Manage your blocked contacts</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <BlockedContactsDialog open={blockedContactsOpen} onOpenChange={setBlockedContactsOpen} currentUserId={profile.id} />
      </div>
    );
  }

  // 4. Notifications Sub-panel
  if (selectedSection === "notifications") {
    return (
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedSection(null)}
            className="rounded-xl size-8 shrink-0 hover:bg-muted"
            aria-label="Back to settings"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Notifications</h3>
            <p className="text-[11px] text-muted-foreground truncate">Alerts, tones & vibration</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-4">
          {/* Notifications toggle */}
          <div className="flex items-center justify-between rounded-2xl border bg-card/60 p-3">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Bell className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Message Alerts</p>
                <p className="text-[11px] text-muted-foreground">Show alerts for new messages</p>
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

          {/* Notification Tone */}
          <div className="rounded-2xl border bg-card/60 p-3 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Volume2 className="size-4" />
              </div>
              <p className="text-xs font-semibold text-foreground">Notification Tone</p>
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
                  className={`rounded-xl py-2 text-[11px] font-semibold transition-all cursor-pointer ${
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

          {/* Vibrate */}
          <div className="flex items-center justify-between rounded-2xl border bg-card/60 p-3">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Phone className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Vibrate</p>
                <p className="text-[11px] text-muted-foreground">Vibrate on message delivery</p>
              </div>
            </div>
            <Switch checked={vibrateEnabled} onCheckedChange={setVibrateEnabled} />
          </div>
        </div>
      </div>
    );
  }

  // 5. Language Sub-panel
  if (selectedSection === "language") {
    return (
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedSection(null)}
            className="rounded-xl size-8 shrink-0 hover:bg-muted"
            aria-label="Back to settings"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Language</h3>
            <p className="text-[11px] text-muted-foreground truncate">Selected: {selectedLanguage}</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-1.5">
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
              className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition cursor-pointer ${
                selectedLanguage === lang
                  ? "border-primary/50 bg-primary/10 text-primary font-semibold shadow-2xs"
                  : "border-border/70 bg-card/60 hover:bg-muted text-foreground"
              }`}
            >
              <span className="text-xs">{lang}</span>
              {selectedLanguage === lang && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 6. Help & Feedback Sub-panel
  if (selectedSection === "help") {
    return (
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedSection(null)}
            className="rounded-xl size-8 shrink-0 hover:bg-muted"
            aria-label="Back to settings"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Help & Feedback</h3>
            <p className="text-[11px] text-muted-foreground truncate">Support, FAQs & policies</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-2.5">
          {/* Help Centre -> Opens FAQ in side panel */}
          <button
            type="button"
            onClick={() => setSelectedSection("help:faq")}
            className="flex w-full items-center justify-between rounded-2xl border bg-card/60 p-3 hover:bg-muted transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <HelpCircle className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Help Centre</p>
                <p className="text-[11px] text-muted-foreground">Browse FAQs & user guides</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>

          {/* Contact Us -> Opens Query form in side panel */}
          <button
            type="button"
            onClick={() => setSelectedSection("help:contact")}
            className="flex w-full items-center justify-between rounded-2xl border bg-card/60 p-3 hover:bg-muted transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <MessageSquare className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Contact Us</p>
                <p className="text-[11px] text-muted-foreground">Submit a query or ticket</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>

          {/* Privacy Policy -> Opens Privacy Policy in side panel */}
          <button
            type="button"
            onClick={() => setSelectedSection("help:privacy")}
            className="flex w-full items-center justify-between rounded-2xl border bg-card/60 p-3 hover:bg-muted transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Shield className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Privacy Policy</p>
                <p className="text-[11px] text-muted-foreground">Data controls & telemetry</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>

          {/* Download Android APK */}
          <a
            href="/downloads/AetherChat.apk"
            download="AetherChat.apk"
            className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 p-3 hover:bg-primary/20 transition"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/20 text-primary shrink-0">
                <Download className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">Download Android App</p>
                <p className="text-[11px] text-muted-foreground">Native signed APK build</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-primary" />
          </a>
        </div>
      </div>
    );
  }

  // 6a. FAQ Sub-panel (opens FAQ in side panel)
  if (selectedSection === "help:faq") {
    return (
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedSection("help")}
            className="rounded-xl size-8 shrink-0 hover:bg-muted"
            aria-label="Back to Help & Feedback"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Help Centre & FAQ</h3>
            <p className="text-[11px] text-muted-foreground truncate">Frequently asked questions</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5">
          <FaqSection
            compact
            onNavigate={(tab) => setSelectedSection(tab === "contact" ? "help:contact" : "help:privacy")}
          />
        </div>
      </div>
    );
  }

  // 6b. Contact Us / Query Form Sub-panel (opens Query form in side panel)
  if (selectedSection === "help:contact") {
    return (
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedSection("help")}
            className="rounded-xl size-8 shrink-0 hover:bg-muted"
            aria-label="Back to Help & Feedback"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Contact Us</h3>
            <p className="text-[11px] text-muted-foreground truncate">Submit a query or ticket</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5">
          <InAppContactForm profile={profile} userEmail={authEmail || undefined} compact />
        </div>
      </div>
    );
  }

  // 6c. Privacy Policy Sub-panel (opens Privacy Policy in side panel)
  if (selectedSection === "help:privacy") {
    return (
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedSection("help")}
            className="rounded-xl size-8 shrink-0 hover:bg-muted"
            aria-label="Back to Help & Feedback"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Privacy Policy</h3>
            <p className="text-[11px] text-muted-foreground truncate">Security & data controls</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5">
          <InAppPrivacyView profile={profile} userEmail={authEmail || undefined} compact />
        </div>
      </div>
    );
  }

  // ═══════════ MAIN SETTINGS MENU LIST ═══════════
  return (
    <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
      {/* Circular Avatar Profile Header */}
      <Link href="/profile" className="flex flex-col items-center gap-2 py-5 border-b border-border transition hover:bg-muted/40 shrink-0">
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

            // Invite a Friend — coming soon action
            if (item.id === "invite") {
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setComingSoonFeature("Invite Friends & QR Code Sharing");
                    setComingSoonOpen(true);
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border bg-card/60 p-3.5 text-left transition-all hover:bg-muted hover:border-primary/40 shadow-xs cursor-pointer"
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

            // In-panel navigation
            return (
              <button
                key={item.id}
                onClick={() => setSelectedSection(item.id)}
                className="flex w-full items-center justify-between rounded-2xl border bg-card/60 p-3.5 text-left transition-all hover:bg-muted hover:border-primary/40 shadow-xs cursor-pointer"
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
          })}
        </div>
      </ScrollArea>

      {/* Logout Button */}
      <div className="p-3 shrink-0">
        <Button
          variant="destructive"
          size="lg"
          onClick={() => void logout()}
          className="w-full flex items-center justify-center gap-2 rounded-2xl text-xs font-bold shadow-md cursor-pointer"
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
