"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Download,
  Edit2,
  Globe,
  HardDrive,
  HelpCircle,
  Key,
  KeyRound,
  Keyboard,
  Link2,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Monitor,
  Palette,
  Phone,
  Plus,
  Save,
  Search,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  UserX,
  Volume2,
  X,
} from "lucide-react";
import { playNotificationSound, requestNotificationPermission } from "@/lib/notifications";
import { toast } from "@/lib/toast";
import { ComingSoonDialog } from "@/components/ui/coming-soon-dialog";
import { ChangePasswordDialog } from "@/components/settings/change-password-dialog";
import { ChangeEmailDialog } from "@/components/settings/change-email-dialog";
import { BlockedContactsDialog } from "@/components/settings/blocked-contacts-dialog";
import { TwoFactorDialog } from "@/components/settings/two-factor-dialog";
import { PhoneVerificationDialog } from "@/components/settings/phone-verification-dialog";
import { AppearancePanel } from "@/components/settings/appearance-panel";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { ChatsSettings } from "@/components/settings/chats-settings";
import { StorageSettings } from "@/components/settings/storage-settings";
import { PermissionsSettings } from "@/components/settings/permissions-settings";
import { KeyboardShortcutsDialog } from "@/components/settings/keyboard-shortcuts-dialog";
import { LinkedDevicesDialog } from "@/components/settings/linked-devices-dialog";
import { NoteStatusDialog } from "@/components/settings/note-status-dialog";
import { ProfilePhotoSheet } from "@/components/settings/profile-photo-sheet";
import { CameraCaptureDialog } from "@/components/chat/composer/camera-capture-dialog";
import { FaqSection } from "@/components/help/faq-section";
import { InAppContactForm } from "@/components/help/in-app-contact-form";
import { InAppPrivacyView } from "@/components/help/in-app-privacy-view";
import { ACCENT_COLORS, BUBBLE_STYLES, useAppearance } from "@/lib/appearance-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials, sanitizeFilename } from "@/lib/utils";
import { useBackHandler } from "@/hooks/use-back-handler";
import type { Profile } from "@/types/chat";

interface SettingsViewProps {
  profile: Profile;
  activeSection?: string | null;
  onSectionChange?: (section: string | null) => void;
  onNavigateToProfile?: () => void;
}

type VisibilityOption = "everyone" | "contacts" | "nobody";

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
    <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`rounded-xl py-2 text-[11px] font-semibold transition-all cursor-pointer ${
              value === opt.id
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsView({
  profile,
  activeSection,
  onSectionChange,
  onNavigateToProfile,
}: SettingsViewProps) {
  const [internalSection, setInternalSection] = useState<string | null>(null);
  const selectedSection = activeSection !== undefined ? activeSection : internalSection;

  const setSelectedSection = (section: string | null) => {
    setInternalSection(section);
    onSectionChange?.(section);
  };

  // Priority 2: Dismiss settings sub-panel on back press
  useBackHandler({
    id: "settings-sub-panel",
    priority: 50,
    enabled: Boolean(selectedSection),
    onBack: () => {
      if (selectedSection?.startsWith("help:")) {
        setSelectedSection("help");
      } else {
        setSelectedSection(null);
      }
    },
  });

  // Profile Edit States in Side Panel
  const [currentDisplayName, setCurrentDisplayName] = useState(profile.display_name);
  const [currentBio, setCurrentBio] = useState(profile.bio || "");
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(profile.avatar_url);
  const [currentUsername, setCurrentUsername] = useState(profile.username);
  const [nameInput, setNameInput] = useState(profile.display_name);
  const [bioInput, setBioInput] = useState(profile.bio || "");
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [phone, setPhone] = useState("");
  const [profileLinks, setProfileLinks] = useState<string[]>([""]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [savingAllProfile, setSavingAllProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function countWords(text: string): number {
    return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  }

  function addProfileLink() {
    if (profileLinks.length >= 5) {
      toast.error("Maximum 5 links allowed");
      return;
    }
    setProfileLinks([...profileLinks, ""]);
  }

  function updateProfileLink(index: number, val: string) {
    const updated = [...profileLinks];
    updated[index] = val;
    setProfileLinks(updated);
  }

  function removeProfileLink(index: number) {
    setProfileLinks(profileLinks.filter((_, i) => i !== index));
  }

  async function handleAvatarUpload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Avatar must be 6 MB or smaller");
      return;
    }

    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const path = `${profile.id}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const newUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newUrl })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setCurrentAvatarUrl(newUrl);
      toast.success("Profile photo updated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload avatar";
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSelectDefaultAvatar(svgDataUrl: string) {
    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: svgDataUrl })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setCurrentAvatarUrl(svgDataUrl);
      toast.success("Profile avatar updated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update avatar";
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setCurrentAvatarUrl(null);
      toast.success("Profile photo removed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove avatar";
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveDisplayName() {
    if (!nameInput.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: nameInput.trim() })
        .eq("id", profile.id);

      if (error) throw error;
      setCurrentDisplayName(nameInput.trim());
      setIsEditingName(false);
      toast.success("Name updated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update name";
      toast.error(msg);
    }
  }

  async function handleSaveUsername() {
    const trimmed = usernameInput.trim();
    if (trimmed.length < 3 || trimmed.length > 30) {
      toast.error("Username must be between 3 and 30 characters");
      return;
    }
    if (!/^[A-Za-z0-9_]+$/.test(trimmed)) {
      toast.error("Username can only contain letters, numbers, and underscores");
      return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ username: trimmed })
        .eq("id", profile.id);

      if (error) throw error;
      setCurrentUsername(trimmed);
      setIsEditingUsername(false);
      toast.success("Username updated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update username";
      toast.error(msg);
    }
  }

  async function handleSaveBio() {
    if (countWords(bioInput) > 100) {
      toast.error("Bio must be 100 words or fewer");
      return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ bio: bioInput.trim() })
        .eq("id", profile.id);

      if (error) throw error;
      setCurrentBio(bioInput.trim());
      setIsEditingBio(false);
      toast.success("About updated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update about";
      toast.error(msg);
    }
  }

  async function handleSaveAllProfileChanges() {
    const trimmedName = nameInput.trim() || currentDisplayName;
    const trimmedUsername = usernameInput.trim() || currentUsername;
    const trimmedBio = bioInput.trim();

    if (!trimmedName) {
      toast.error("Name cannot be empty");
      return;
    }
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      toast.error("Username must be between 3 and 30 characters");
      return;
    }
    if (!/^[A-Za-z0-9_]+$/.test(trimmedUsername)) {
      toast.error("Username can only contain letters, numbers, and underscores");
      return;
    }
    if (countWords(trimmedBio) > 100) {
      toast.error("Bio must be 100 words or fewer");
      return;
    }

    setSavingAllProfile(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: trimmedName,
          username: trimmedUsername,
          bio: trimmedBio,
          avatar_url: currentAvatarUrl,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      setCurrentDisplayName(trimmedName);
      setCurrentUsername(trimmedUsername);
      setCurrentBio(trimmedBio);
      setIsEditingName(false);
      setIsEditingUsername(false);
      setIsEditingBio(false);
      toast.success("All profile changes saved successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save profile changes";
      toast.error(msg);
    } finally {
      setSavingAllProfile(false);
    }
  }

  // Coming Soon State
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState("Feature");
  const [comingSoonDescription, setComingSoonDescription] = useState("");

  function triggerComingSoon(feature: string, desc?: string) {
    setComingSoonFeature(feature);
    setComingSoonDescription(desc || "");
    setComingSoonOpen(true);
  }

  // Security Sub-Dialog States
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [blockedContactsOpen, setBlockedContactsOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [phoneVerificationOpen, setPhoneVerificationOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  // 24-Hour Note Status State (max 60 chars, 24h expiration)
  const [noteStatus, setNoteStatus] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`aether_note_${profile.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          const now = Date.now();
          if (now - parsed.createdAt < 24 * 60 * 60 * 1000 && parsed.text) {
            return parsed.text;
          } else {
            localStorage.removeItem(`aether_note_${profile.id}`);
          }
        }
      } catch { }
    }
    return "Can't talk, AetherChat only";
  });
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  function handleSaveNote(text: string) {
    const trimmed = text.trim().slice(0, 60);
    if (!trimmed) {
      handleDeleteNote();
      return;
    }
    setNoteStatus(trimmed);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `aether_note_${profile.id}`,
        JSON.stringify({ text: trimmed, createdAt: Date.now() })
      );
    }
    toast.success("Note status updated (active for 24 hours)");
  }

  function handleDeleteNote() {
    setNoteStatus("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(`aether_note_${profile.id}`);
    }
    toast.info("Note status cleared");
  }

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
  const [readReceipts, setReadReceipts] = useState(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("privacy_read_receipts");
      if (v !== null) return v === "true";
    }
    return true;
  });
  const [disappearingTimer, setDisappearingTimer] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("privacy_disappearing_timer") || "Off";
    }
    return "Off";
  });

  // Dialog States
  const [linkedDevicesOpen, setLinkedDevicesOpen] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);

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

  const [searchQuery, setSearchQuery] = useState("");

  const settingsItems = [
    {
      id: "account",
      title: "Account",
      subtitle: "Email, passkey, password & security",
      icon: KeyRound,
      action: () => setSelectedSection("account"),
    },
    {
      id: "privacy",
      title: "Privacy & Security",
      subtitle: "Visibility, read receipts & linked devices",
      icon: ShieldCheck,
      action: () => setSelectedSection("privacy"),
    },
    {
      id: "chats",
      title: "Chats",
      subtitle: "Enter is send, archive behavior & auto-download",
      icon: MessageSquare,
      action: () => setSelectedSection("chats"),
    },
    {
      id: "appearance",
      title: "Appearance",
      subtitle: `${ACCENT_COLORS.find((a) => a.id === preferences.accentColor)?.label || "Violet"} · ${BUBBLE_STYLES.find((b) => b.id === preferences.bubbleStyle)?.label || "Default"}${preferences.chatBackground !== "default" ? " · Wallpaper" : ""}`,
      icon: Palette,
      action: () => setSelectedSection("appearance"),
    },
    {
      id: "notifications",
      title: "Notifications",
      subtitle: "Alerts, tone & vibration",
      icon: Bell,
      action: () => setSelectedSection("notifications"),
    },
    {
      id: "storage",
      title: "Storage & Data",
      subtitle: "Cache usage, media storage & network",
      icon: HardDrive,
      action: () => setSelectedSection("storage"),
    },
    {
      id: "shortcuts",
      title: "Keyboard Shortcuts",
      subtitle: "Quick cheat sheet for desktop navigation",
      icon: Keyboard,
      action: () => setKeyboardShortcutsOpen(true),
    },
    {
      id: "permissions",
      title: "Device Permissions",
      subtitle: "Camera, mic, notifications & hardware access",
      icon: ShieldAlert,
      action: () => setSelectedSection("permissions"),
    },
    {
      id: "language",
      title: "Language",
      subtitle: selectedLanguage,
      icon: Globe,
      action: () => setSelectedSection("language"),
    },
    {
      id: "invite",
      title: "Invite a Friend",
      subtitle: "Share Aether Chat with friends",
      icon: UserPlus,
      action: () => {
        setComingSoonFeature("Invite Friends & QR Code Sharing");
        setComingSoonOpen(true);
      },
    },
    {
      id: "help",
      title: "Help & Feedback",
      subtitle: "Help centre, contact us & policies",
      icon: HelpCircle,
      action: () => setSelectedSection("help"),
    },
  ];

  const filteredItems = settingsItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ═══════════ IN-PANEL SUB-VIEWS ═══════════

  // 0. Profile Sub-panel (Full in-panel WhatsApp Web Profile View)
  if (selectedSection === "profile") {
    const bioWordCount = countWords(bioInput);

    return (
      <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none">
        {/* Top Header */}
        <div className="flex items-center gap-2 p-3.5 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedSection(null)}
            className="rounded-xl size-8 shrink-0 hover:bg-muted cursor-pointer"
            aria-label="Back to settings"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Profile</h3>
            <p className="text-[11px] text-muted-foreground truncate">Edit info, photo & account</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-5 space-y-5 pb-28 md:pb-6">
          {/* 1. Centered Large Avatar & Camera Badge matching WhatsApp */}
          <div className="flex flex-col items-center justify-center pt-4 pb-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setPhotoSheetOpen(true)}
                className="group relative size-40 sm:size-44 rounded-full overflow-hidden border-2 border-border/80 shadow-md ring-4 ring-primary/10 cursor-pointer focus:outline-none transition-transform hover:scale-[1.01]"
                title="Change profile picture"
                aria-label="Change profile picture"
              >
                <Avatar className="size-full">
                  <AvatarImage src={currentAvatarUrl || undefined} alt={currentDisplayName} className="object-cover" />
                  <AvatarFallback className="text-5xl font-bold bg-muted text-foreground uppercase">
                    {(currentDisplayName?.trim()[0] || profile.display_name?.trim()[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1.5 p-2 text-center">
                  <Camera className="size-8" />
                  <span className="text-[11px] font-semibold tracking-wider uppercase">
                    {uploadingAvatar ? "Updating..." : "Change Photo"}
                  </span>
                </div>
              </button>

              {/* Pink/Coral Camera Badge Button (matching WhatsApp) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPhotoSheetOpen(true);
                }}
                disabled={uploadingAvatar}
                className="absolute bottom-1 right-1 grid size-12 place-items-center rounded-full bg-[#e91e63] dark:bg-[#f06292] text-white shadow-lg ring-4 ring-background cursor-pointer hover:scale-110 active:scale-95 transition-transform z-10"
                aria-label="Open profile photo options"
                title="Change profile picture"
              >
                {uploadingAvatar ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <Camera className="size-6" />
                )}
              </button>
            </div>
          </div>

          {/* 2. Section: Your Name */}
          <div className="space-y-2 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-2xs">
            <span className="text-xs font-semibold text-primary">Your name</span>
            {isEditingName ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSaveDisplayName();
                    if (e.key === "Escape") {
                      setNameInput(currentDisplayName);
                      setIsEditingName(false);
                    }
                  }}
                  autoFocus
                  maxLength={50}
                  className="flex-1 bg-muted/60 border border-border rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    setNameInput(currentDisplayName);
                    setIsEditingName(false);
                  }}
                  className="size-8 rounded-xl cursor-pointer"
                  title="Cancel"
                >
                  <X className="size-4" />
                </Button>
                <Button
                  size="icon-sm"
                  onClick={() => void handleSaveDisplayName()}
                  className="size-8 rounded-xl bg-primary text-primary-foreground font-bold cursor-pointer"
                  title="Save name"
                >
                  <Check className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-sm font-semibold text-foreground truncate pr-2">
                  {currentDisplayName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(currentDisplayName);
                    setIsEditingName(true);
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                  title="Edit name"
                >
                  <Edit2 className="size-4" />
                </button>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground leading-snug pt-1">
              This is not your username or PIN. This name will be visible to your Aether Chat contacts.
            </p>
          </div>

          {/* 3. Section: Username */}
          <div className="space-y-2 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-2xs">
            <span className="text-xs font-semibold text-primary">Username</span>
            {isEditingUsername ? (
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    @
                  </span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSaveUsername();
                      if (e.key === "Escape") {
                        setUsernameInput(currentUsername);
                        setIsEditingUsername(false);
                      }
                    }}
                    autoFocus
                    minLength={3}
                    maxLength={30}
                    className="w-full bg-muted/60 border border-border rounded-xl pl-7 pr-3 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    setUsernameInput(currentUsername);
                    setIsEditingUsername(false);
                  }}
                  className="size-8 rounded-xl cursor-pointer"
                  title="Cancel"
                >
                  <X className="size-4" />
                </Button>
                <Button
                  size="icon-sm"
                  onClick={() => void handleSaveUsername()}
                  className="size-8 rounded-xl bg-primary text-primary-foreground font-bold cursor-pointer"
                  title="Save username"
                >
                  <Check className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-sm font-mono font-medium text-foreground truncate pr-2">
                  @{currentUsername}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUsernameInput(currentUsername);
                    setIsEditingUsername(true);
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                  title="Edit username"
                >
                  <Edit2 className="size-4" />
                </button>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground leading-snug pt-1">
              Your unique @handle. Used for mentions and finding you on Aether Chat.
            </p>
          </div>

          {/* 4. Section: About / Bio */}
          <div className="space-y-2 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">About</span>
              <span className={`text-[10px] ${bioWordCount > 90 ? "text-rose-500 font-semibold" : "text-muted-foreground"}`}>
                {bioWordCount}/100 words
              </span>
            </div>
            {isEditingBio ? (
              <div className="flex items-start gap-2 pt-1">
                <textarea
                  value={bioInput}
                  onChange={(e) => {
                    if (countWords(e.target.value) <= 100) {
                      setBioInput(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSaveBio();
                    }
                    if (e.key === "Escape") {
                      setBioInput(currentBio);
                      setIsEditingBio(false);
                    }
                  }}
                  autoFocus
                  rows={3}
                  className="flex-1 bg-muted/60 border border-border rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Write a short bio about yourself..."
                />
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => {
                      setBioInput(currentBio);
                      setIsEditingBio(false);
                    }}
                    className="size-7 rounded-lg cursor-pointer"
                    title="Cancel"
                  >
                    <X className="size-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    onClick={() => void handleSaveBio()}
                    className="size-7 rounded-lg bg-primary text-primary-foreground font-bold cursor-pointer"
                    title="Save about"
                  >
                    <Check className="size-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-sm font-normal text-foreground truncate pr-2">
                  {currentBio || "Available"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBioInput(currentBio);
                    setIsEditingBio(true);
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                  title="Edit about"
                >
                  <Edit2 className="size-4" />
                </button>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground leading-snug pt-1">
              Tell your contacts about yourself or share a status.
            </p>
          </div>

          {/* 5. Section: Email */}
          <div className="rounded-2xl border border-border/80 bg-card/60 p-4 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground uppercase font-semibold">Email</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                <Check className="size-3" />
                Verified
              </span>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <Mail className="size-4 text-muted-foreground shrink-0" />
              <p className="text-sm font-medium text-foreground truncate">
                {authEmail || `${currentUsername}@aetherchat.app`}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug pt-1">
              Associated with your authentication credentials.
            </p>
          </div>

          {/* 6. Section: Phone Number */}
          <div className="rounded-2xl border border-border/80 bg-card/60 p-4 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-primary">Phone Number</label>
              <button
                type="button"
                onClick={() => setPhoneVerificationOpen(true)}
                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
              >
                {phone ? "Change Phone" : "Verify Phone"}
              </button>
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-muted/60 border border-border rounded-xl pl-9 pr-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Used for SMS two-factor authentication and account recovery.
            </p>
          </div>

          {/* 7. Section: Social & Portfolio Links */}
          <div className="rounded-2xl border border-border/80 bg-card/60 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-primary">Social & Portfolio Links</label>
              <span className="text-[10px] text-muted-foreground font-medium">
                {profileLinks.filter(Boolean).length}/5 links
              </span>
            </div>
            <div className="space-y-2">
              {profileLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={link}
                      onChange={(e) => updateProfileLink(index, e.target.value)}
                      className="w-full bg-muted/60 border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  {profileLinks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeProfileLink(index)}
                      className="text-rose-500 hover:text-rose-400 shrink-0 size-8 rounded-xl cursor-pointer"
                      title="Remove link"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {profileLinks.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full text-xs gap-1.5 h-8 px-3 cursor-pointer"
                onClick={addProfileLink}
              >
                <Plus className="size-3.5" />
                <span>Add Link</span>
              </Button>
            )}
            <p className="text-[11px] text-muted-foreground leading-snug">
              Display public portfolio, blog, or social handles.
            </p>
          </div>

          {/* 8. Section: Save All Changes */}
          <div className="pt-2">
            <Button
              type="button"
              size="lg"
              onClick={() => void handleSaveAllProfileChanges()}
              disabled={savingAllProfile || uploadingAvatar}
              className="w-full rounded-2xl h-11 font-semibold gap-2 shadow-md cursor-pointer"
            >
              {savingAllProfile ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              <span>Save Changes</span>
            </Button>
          </div>
        </div>

        {/* Child Dialogs for Profile */}
        <ComingSoonDialog
          open={comingSoonOpen}
          onOpenChange={setComingSoonOpen}
          featureName={comingSoonFeature}
          description={comingSoonDescription}
        />

        <PhoneVerificationDialog
          open={phoneVerificationOpen}
          onOpenChange={setPhoneVerificationOpen}
          onVerified={(verifiedNumber) => {
            setPhone(verifiedNumber);
            toast.success(`Phone verified: ${verifiedNumber}`);
          }}
        />

        {/* Profile Photo Slide-up Action Sheet */}
        <ProfilePhotoSheet
          open={photoSheetOpen}
          onOpenChange={setPhotoSheetOpen}
          onSelectCamera={() => setCameraModalOpen(true)}
          onSelectFile={(file) => void handleAvatarUpload(file)}
          onSelectDefaultAvatar={(svgDataUrl) => void handleSelectDefaultAvatar(svgDataUrl)}
          onRemovePhoto={() => void handleRemoveAvatar()}
          loading={uploadingAvatar}
        />

        {/* In-app Camera Viewfinder */}
        <CameraCaptureDialog
          open={cameraModalOpen}
          mode="photo"
          onOpenChange={setCameraModalOpen}
          onCaptureMedia={(file) => {
            setCameraModalOpen(false);
            void handleAvatarUpload(file);
          }}
        />
      </div>
    );
  }

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

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-3 pb-28 md:pb-6">
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

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-4 pb-28 md:pb-6">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Who Can See</p>

          <VisibilitySelector label="Last Seen & Online" value={lastSeenVisibility} onChange={setLastSeenVisibility} />
          <VisibilitySelector label="Profile Picture" value={profilePicVisibility} onChange={setProfilePicVisibility} />
          <VisibilitySelector label="Bio & About" value={bioVisibility} onChange={setBioVisibility} />

          {/* Messaging & Activity */}
          <p className="text-xs font-bold text-foreground uppercase tracking-wider pt-2">
            Messaging & Activity
          </p>

          {/* Read Receipts Toggle */}
          <div className="flex items-center justify-between rounded-2xl border bg-card/60 p-3.5 shadow-2xs">
            <div className="flex items-start gap-3 min-w-0 pr-2">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <CheckCheck className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Read receipts</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  If turned off, you won&apos;t send or receive read receipts. Read receipts are always sent for group chats.
                </p>
              </div>
            </div>
            <Switch
              checked={readReceipts}
              onCheckedChange={(val) => {
                setReadReceipts(val);
                if (typeof window !== "undefined") {
                  localStorage.setItem("privacy_read_receipts", String(val));
                }
                toast.success(val ? "Read receipts enabled" : "Read receipts disabled");
              }}
              aria-label="Toggle read receipts"
            />
          </div>

          {/* Default message timer for disappearing messages */}
          <div className="space-y-2 rounded-2xl border border-border bg-card/60 p-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Clock className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Default message timer</p>
                <p className="text-[11px] text-muted-foreground">Start new chats with disappearing messages</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {(["Off", "24 hours", "7 days", "90 days"] as const).map((timer) => (
                <button
                  key={timer}
                  type="button"
                  onClick={() => {
                    setDisappearingTimer(timer);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("privacy_disappearing_timer", timer);
                    }
                    toast.success(`Default timer set to ${timer}`);
                  }}
                  className={`rounded-xl py-2 text-[11px] font-semibold transition-all cursor-pointer ${disappearingTimer === timer
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                >
                  {timer}
                </button>
              ))}
            </div>
          </div>

          {/* Security & Sessions */}
          <p className="text-xs font-bold text-foreground uppercase tracking-wider pt-2">
            Security & Sessions
          </p>

          {/* Linked Devices / Active Sessions */}
          <button
            type="button"
            onClick={() => setLinkedDevicesOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl border bg-card/60 p-3 hover:bg-muted transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Monitor className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Linked Devices</p>
                <p className="text-[11px] text-muted-foreground">Active sessions & remote sign-out</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>

          {/* Blocked Contacts */}
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

          {/* Device & Hardware Permissions */}
          <button
            type="button"
            onClick={() => setSelectedSection("permissions")}
            className="flex w-full items-center justify-between rounded-2xl border bg-card/60 p-3 hover:bg-muted transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <ShieldAlert className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Device Permissions</p>
                <p className="text-[11px] text-muted-foreground">Camera, microphone, notifications & storage</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </div>

        <BlockedContactsDialog open={blockedContactsOpen} onOpenChange={setBlockedContactsOpen} currentUserId={profile.id} />
        <LinkedDevicesDialog open={linkedDevicesOpen} onOpenChange={setLinkedDevicesOpen} />
      </div>
    );
  }

  // 4. Chats Sub-panel
  if (selectedSection === "chats") {
    return <ChatsSettings onBack={() => setSelectedSection(null)} />;
  }

  // 5. Storage & Data Sub-panel
  if (selectedSection === "storage") {
    return <StorageSettings onBack={() => setSelectedSection(null)} />;
  }

  // 5b. Device Permissions Sub-panel
  if (selectedSection === "permissions") {
    return <PermissionsSettings onBack={() => setSelectedSection(null)} />;
  }

  // 6. Notifications Sub-panel (Modern Nested UI)
  if (selectedSection === "notifications") {
    return <NotificationSettings onBack={() => setSelectedSection(null)} />;
  }

  // 7. Language Sub-panel
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

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-1.5 pb-28 md:pb-6">
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
              className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition cursor-pointer ${selectedLanguage === lang
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

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 space-y-2.5 pb-28 md:pb-6">
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

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 pb-28 md:pb-6">
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

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 pb-28 md:pb-6">
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

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 pb-28 md:pb-6">
          <InAppPrivacyView profile={profile} userEmail={authEmail || undefined} compact />
        </div>
      </div>
    );
  }

  // ═══════════ MAIN SETTINGS MENU LIST ═══════════
  return (
    <div className="flex h-full flex-col bg-background text-foreground min-h-0 select-none overflow-hidden">
      {/* Top Header */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
      </div>

      {/* Search Input */}
      <div className="px-4 pb-3 shrink-0">
        <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2 border border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Navigation List (Scrollable Hero Banner + Settings Items) */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col py-2 pb-28 md:pb-6">
          {/* Centered WhatsApp-Style Hero Profile Banner (Scrollable) */}
          <div className="w-full px-6 pt-2 pb-5 flex flex-col items-center justify-center border-b border-border bg-gradient-to-b from-card/40 via-card/20 to-transparent text-center select-none shrink-0 relative">
            {/* Thought Cloud Bubble for 24h Note Status (Up to 60 chars) */}
            <div className="relative mb-2 flex flex-col items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setNoteDialogOpen(true);
                }}
                className="group/note relative z-20 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                title="Click to edit 24h note status"
              >
                {/* Main Cloud Pill Bubble (Theme-Synced) */}
                <div className="rounded-full bg-card/95 text-foreground border border-border/80 hover:border-primary/50 shadow-md backdrop-blur-md px-4 py-1.5 flex items-center gap-1.5 max-w-[280px] transition-colors">
                  <span className="text-xs sm:text-[13px] font-medium truncate select-none">
                    {noteStatus || "Can't talk, AetherChat only"}
                  </span>
                </div>

                {/* Thought Cloud Droplet 1 (Medium circle at bottom-left of pill) */}
                <span
                  className="absolute -bottom-1.5 left-7 size-3 rounded-full bg-card/95 border border-border/80 group-hover/note:border-primary/50 shadow-2xs transition-colors"
                  aria-hidden="true"
                />

                {/* Thought Cloud Droplet 2 (Small circle overlapping top of avatar) */}
                <span
                  className="absolute -bottom-3.5 left-9 size-1.5 rounded-full bg-card/95 border border-border/80 group-hover/note:border-primary/50 shadow-2xs transition-colors"
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Centered Circular Avatar (96px) with Camera/Edit Badge - Opens Profile in Side Panel */}
            <button
              type="button"
              onClick={() => setSelectedSection("profile")}
              className="group/avatar flex flex-col items-center justify-center cursor-pointer focus:outline-none"
              title="Click to view and edit profile in side panel"
            >
              <div className="relative">
                <Avatar className="size-24 rounded-full border-2 border-border shadow-md ring-4 ring-primary/10 transition-transform group-hover/avatar:scale-[1.02]">
                  <AvatarImage
                    src={currentAvatarUrl || undefined}
                    alt={currentDisplayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-full text-2xl font-bold bg-muted text-foreground uppercase">
                    {(currentDisplayName?.trim()[0] || profile.display_name?.trim()[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Small camera/edit badge attached to bottom-right corner */}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoSheetOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      setPhotoSheetOpen(true);
                    }
                  }}
                  className="absolute bottom-0 right-0 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background transition-transform group-hover/avatar:scale-110 cursor-pointer"
                  title="Change profile picture"
                >
                  <Camera className="size-3.5" />
                </span>
              </div>

              {/* Display Name & @handle with subtle chevron (›) */}
              <div className="mt-3 flex flex-col items-center text-center">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-foreground tracking-tight group-hover/avatar:text-primary transition-colors">
                    {currentDisplayName || profile.display_name || "User"}
                  </h2>
                  <span className="text-muted-foreground group-hover/avatar:text-foreground group-hover/avatar:translate-x-0.5 transition-all text-sm font-semibold select-none">
                    ›
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  @{profile.username || "username"}
                </p>
              </div>
            </button>
          </div>

          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={cn(
                  "flex items-center gap-6 px-6 py-3.5 hover:bg-muted transition-colors w-full text-left group cursor-pointer",
                  item.id === "invite" && "block md:hidden",
                  item.id === "shortcuts" && "hidden md:flex"
                )}
              >
                <div className="flex items-center gap-6 w-full">
                  <Icon className="text-muted-foreground group-hover:text-foreground shrink-0 size-5" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[15px] font-normal text-foreground leading-snug">
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.subtitle}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No settings found for &ldquo;{searchQuery}&rdquo;
            </div>
          )}

          {/* Divider line */}
          <div className="h-px bg-border my-2 mx-6" />

          {/* Log Out Row */}
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-6 px-6 py-3.5 hover:bg-destructive/10 text-destructive transition-colors w-full text-left group cursor-pointer"
          >
            <LogOut className="shrink-0 size-5 text-destructive" />
            <span className="text-[15px] font-medium">Log out</span>
          </button>
        </div>
      </ScrollArea>

      <ComingSoonDialog
        open={comingSoonOpen}
        onOpenChange={setComingSoonOpen}
        featureName={comingSoonFeature}
      />

      <KeyboardShortcutsDialog
        open={keyboardShortcutsOpen}
        onOpenChange={setKeyboardShortcutsOpen}
      />

      <NoteStatusDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        currentNote={noteStatus}
        onSaveNote={handleSaveNote}
        onDeleteNote={handleDeleteNote}
      />

      {/* Profile Photo Slide-up Action Sheet */}
      <ProfilePhotoSheet
        open={photoSheetOpen}
        onOpenChange={setPhotoSheetOpen}
        onSelectCamera={() => setCameraModalOpen(true)}
        onSelectFile={(file) => void handleAvatarUpload(file)}
        onSelectDefaultAvatar={(svgDataUrl) => void handleSelectDefaultAvatar(svgDataUrl)}
        onRemovePhoto={() => void handleRemoveAvatar()}
        loading={uploadingAvatar}
      />

      {/* In-app Camera Viewfinder */}
      <CameraCaptureDialog
        open={cameraModalOpen}
        mode="photo"
        onOpenChange={setCameraModalOpen}
        onCaptureMedia={(file) => {
          setCameraModalOpen(false);
          void handleAvatarUpload(file);
        }}
      />
    </div>
  );
}
