"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  Check,
  Globe,
  Github,
  Loader2,
  Mail,
  Save,
  Twitter,
  User,
  Shield,
  Linkedin,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { getInitials, sanitizeFilename } from "@/lib/utils";
import type { Profile } from "@/types/chat";

const MAX_AVATAR_SIZE = 6 * 1024 * 1024;

export function ProfileForm({ profile, userEmail }: { profile: Profile; userEmail?: string }) {
  // Parse initial display name into prefix, first name, last name
  const nameParts = (profile.display_name || "").split(" ");
  const initialPrefix = nameParts.length > 2 && ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."].includes(nameParts[0]) ? nameParts[0] : "";
  const remainingNames = initialPrefix ? nameParts.slice(1) : nameParts;
  const initialFirst = remainingNames[0] || "";
  const initialLast = remainingNames.slice(1).join(" ") || "";

  const [prefix, setPrefix] = useState(initialPrefix);
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [status, setStatus] = useState<"online" | "away" | "busy" | "offline">("online");
  const [email] = useState(userEmail || "user@chatsphere.app");

  // Optional Social Links
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");

  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);

  const fullDisplayName = [prefix, firstName, lastName].filter(Boolean).join(" ").trim() || profile.display_name;

  async function uploadAvatar(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    if (file.size > MAX_AVATAR_SIZE) return toast.error("Avatar images must be 6 MB or smaller");

    setSaving(true);
    const supabase = createClient();
    const path = `${profile.id}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });

    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setSaving(false);
    toast.success("Avatar uploaded—click Save to update your profile");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const { error } = await createClient()
      .from("profiles")
      .update({
        display_name: fullDisplayName,
        username: username.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved successfully!");
  }

  return (
    <form onSubmit={save} className="rounded-3xl border bg-card p-6 shadow-2xl shadow-black/5 sm:p-8 space-y-8">
      {/* Header Profile Summary & Avatar Upload */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="group relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary/25 to-primary/5 text-2xl font-semibold text-primary ring-1 ring-border shadow-md"
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={fullDisplayName} fill unoptimized className="object-cover" sizes="96px" />
            ) : (
              getInitials(fullDisplayName)
            )}
            <span className="absolute inset-0 grid place-items-center bg-black/60 text-white opacity-0 transition group-hover:opacity-100">
              <Camera className="size-6" />
            </span>
          </button>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">{fullDisplayName}</h2>
            <p className="text-sm font-medium text-muted-foreground">@{username}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  status === "online"
                    ? "bg-emerald-500"
                    : status === "away"
                      ? "bg-amber-500"
                      : status === "busy"
                        ? "bg-rose-500"
                        : "bg-slate-400"
                }`}
              />
              <span className="text-xs capitalize font-semibold text-muted-foreground">{status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
            <Camera className="size-4 mr-1.5" />
            Change Avatar
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void uploadAvatar(event.target.files?.[0])}
          />
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Structured Profile Fields */}
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Personal Details</h3>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Prefix */}
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Prefix / Salutation</label>
            <Input
              placeholder="e.g. Mr., Ms., Dr."
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
            />
          </div>

          {/* First Name */}
          <div className="grid gap-2 sm:col-span-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">First Name</label>
            <Input
              required
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          {/* Last Name */}
          <div className="grid gap-2 sm:col-span-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Last Name</label>
            <Input
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Username */}
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                @
              </span>
              <Input
                required
                minLength={3}
                maxLength={30}
                pattern="[A-Za-z0-9_]+"
                className="pl-7 font-mono text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
              <span>Email Address</span>
              <span className="text-[10px] text-emerald-500 font-medium">Verified</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input readOnly disabled className="pl-9 bg-muted/50 text-muted-foreground" value={email} />
            </div>
          </div>
        </div>

        {/* Status Selector */}
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Online Status</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "online", label: "Online", color: "bg-emerald-500" },
              { id: "away", label: "Away", color: "bg-amber-500" },
              { id: "busy", label: "Busy", color: "bg-rose-500" },
              { id: "offline", label: "Invisible", color: "bg-slate-400" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatus(s.id as typeof status)}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                  status === s.id
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card hover:bg-accent text-muted-foreground"
                }`}
              >
                <span className={`size-2 rounded-full ${s.color}`} />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase flex justify-between">
            <span>Bio / Status Message</span>
            <span className="text-xs font-normal text-muted-foreground">{bio.length}/300</span>
          </label>
          <Textarea
            rows={3}
            maxLength={300}
            placeholder="Write a short bio or status message..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {/* Optional Social Links */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase">Social Links (Optional)</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Website URL"
                className="pl-9 text-xs"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div className="relative">
              <Twitter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Twitter / X handle"
                className="pl-9 text-xs"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
              />
            </div>
            <div className="relative">
              <Github className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="GitHub username"
                className="pl-9 text-xs"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Buttons */}
      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Button type="submit" size="lg" disabled={saving} className="rounded-full gap-2 font-semibold">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          <span>Save Changes</span>
        </Button>
      </div>
    </form>
  );
}
