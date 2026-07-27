"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  ChevronRight,
  Database,
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
  UserCheck,
  UserX,
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
  const [autoDownloadMedia, setAutoDownloadMedia] = useState(true);
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

  const settingsMenu = [
    { id: "profile", icon: User, title: "Profile", desc: "Avatar, display name, bio & social links", href: "/profile" },
    { id: "account", icon: Shield, title: "Account", desc: "Email, security & credentials" },
    { id: "privacy", icon: Lock, title: "Privacy & Security", desc: "Last seen, read receipts & status" },
    { id: "notifications", icon: Bell, title: "Notifications", desc: "Alerts, sound & badges" },
    { id: "appearance", icon: Palette, title: "Appearance", desc: "Theme (Dark/Light) & styling" },
    { id: "storage", icon: Database, title: "Storage & Data", desc: "Media auto-download & cache" },
    { id: "language", icon: Globe, title: "Language", desc: selectedLanguage },
    { id: "devices", icon: Smartphone, title: "Connected Devices", desc: "Active sessions on Web & APK" },
    { id: "blocked", icon: UserX, title: "Blocked Users", desc: "Manage blocked list" },
    { id: "help", icon: HelpCircle, title: "Help Center", desc: "FAQs & customer support" },
    { id: "terms", icon: ShieldAlert, title: "Terms of Service", desc: "Usage terms & guidelines", href: "/terms" },
    { id: "privacy_policy", icon: Lock, title: "Privacy Policy", desc: "Data protection policy", href: "/privacy" },
  ];

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Settings Header Card with Edit Profile Action */}
      <div className="border-b border-sidebar-border p-4">
        <Link
          href="/profile"
          className="flex items-center justify-between gap-3 rounded-2xl border border-sidebar-border bg-muted/40 p-3 transition-all hover:bg-muted/80"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="size-12 border shadow-sm">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
              <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-foreground">{profile.display_name}</h3>
              <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" className="rounded-full text-xs shrink-0">
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* Settings Options List */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1.5 py-3">
          {settingsMenu.map((item) => {
            const Icon = item.icon;
            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-sidebar-border/50 bg-muted/30 p-3.5 transition-all hover:bg-muted/70 hover:border-sidebar-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
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
                  <button className="flex w-full items-center justify-between rounded-2xl border border-sidebar-border/50 bg-muted/30 p-3.5 text-left transition-all hover:bg-muted/70 hover:border-sidebar-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                        <Icon className="size-4" />
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

                  {/* Account */}
                  {item.id === "account" && (
                    <div className="space-y-3 pt-2">
                      <div className="rounded-xl border p-3 bg-muted/40">
                        <p className="text-xs text-muted-foreground">Username</p>
                        <p className="text-sm font-medium mt-0.5">@{profile.username}</p>
                      </div>
                      <div className="rounded-xl border p-3 bg-muted/40">
                        <p className="text-xs text-muted-foreground">Account Status</p>
                        <p className="text-sm font-medium text-emerald-500 mt-0.5">Active & Verified</p>
                      </div>
                    </div>
                  )}

                  {/* Privacy */}
                  {item.id === "privacy" && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between rounded-xl border p-3">
                        <div>
                          <p className="text-sm font-medium">Read Receipts</p>
                          <p className="text-xs text-muted-foreground">Show when you have read messages</p>
                        </div>
                        <Switch checked={readReceipts} onCheckedChange={setReadReceipts} />
                      </div>

                      <div className="flex items-center justify-between rounded-xl border p-3">
                        <div>
                          <p className="text-sm font-medium">Online Status</p>
                          <p className="text-xs text-muted-foreground">Show green online dot to friends</p>
                        </div>
                        <Switch checked={onlinePresence} onCheckedChange={setOnlinePresence} />
                      </div>
                    </div>
                  )}

                  {/* Notifications */}
                  {item.id === "notifications" && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between rounded-xl border p-3">
                        <div>
                          <p className="text-sm font-medium">Message Notifications</p>
                          <p className="text-xs text-muted-foreground">Receive push & in-app alerts</p>
                        </div>
                        <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                      </div>

                      <div className="flex items-center justify-between rounded-xl border p-3">
                        <div>
                          <p className="text-sm font-medium">Notification Sounds</p>
                          <p className="text-xs text-muted-foreground">Play sound when messages arrive</p>
                        </div>
                        <Switch checked={notificationSound} onCheckedChange={setNotificationSound} />
                      </div>
                    </div>
                  )}

                  {/* Appearance */}
                  {item.id === "appearance" && (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Theme Mode</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={theme === "light" ? "default" : "outline"}
                          className="flex flex-col gap-1.5 h-16"
                          onClick={() => setTheme("light")}
                        >
                          <Sun className="size-5" />
                          <span className="text-xs">Light</span>
                        </Button>
                        <Button
                          variant={theme === "dark" ? "default" : "outline"}
                          className="flex flex-col gap-1.5 h-16"
                          onClick={() => setTheme("dark")}
                        >
                          <Moon className="size-5" />
                          <span className="text-xs">Dark</span>
                        </Button>
                        <Button
                          variant={theme === "system" ? "default" : "outline"}
                          className="flex flex-col gap-1.5 h-16"
                          onClick={() => setTheme("system")}
                        >
                          <Laptop className="size-5" />
                          <span className="text-xs">System</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Storage */}
                  {item.id === "storage" && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between rounded-xl border p-3">
                        <div>
                          <p className="text-sm font-medium">Auto-Download Media</p>
                          <p className="text-xs text-muted-foreground">Automatically download images & files</p>
                        </div>
                        <Switch checked={autoDownloadMedia} onCheckedChange={setAutoDownloadMedia} />
                      </div>
                      <Button
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => toast.success("Cache cleared successfully")}
                      >
                        Clear Image Cache
                      </Button>
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
                          className="flex w-full items-center justify-between rounded-xl border p-3 text-left hover:bg-accent"
                        >
                          <span className="text-sm font-medium">{lang}</span>
                          {selectedLanguage === lang && <Check className="size-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Connected Devices */}
                  {item.id === "devices" && (
                    <div className="space-y-3 pt-2">
                      <div className="rounded-xl border p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Laptop className="size-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">Web Browser</p>
                            <p className="text-xs text-emerald-500">Active session</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Smartphone className="size-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">Android APK</p>
                            <p className="text-xs text-muted-foreground">Synchronized</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Blocked Users */}
                  {item.id === "blocked" && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No blocked users.
                    </div>
                  )}

                  {/* Help Center */}
                  {item.id === "help" && (
                    <div className="space-y-3 pt-2">
                      <p className="text-sm text-muted-foreground">
                        Need assistance or have feedback? Get in touch with our support team.
                      </p>
                      <Button asChild className="w-full">
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

      {/* Logout Button at Bottom */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="destructive"
          size="lg"
          onClick={() => void logout()}
          className="w-full flex items-center justify-center gap-2 rounded-2xl text-xs font-semibold shadow-sm"
        >
          <LogOut className="size-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
