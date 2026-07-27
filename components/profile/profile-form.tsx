"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  Link2,
  Loader2,
  Phone,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { getInitials, sanitizeFilename } from "@/lib/utils";
import type { Profile } from "@/types/chat";

const MAX_AVATAR_SIZE = 6 * 1024 * 1024;

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export function ProfileForm({ profile, userEmail }: { profile: Profile; userEmail?: string }) {
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio || "");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [links, setLinks] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const displayName = profile.display_name;
  const bioWordCount = countWords(bio);

  function addLink() {
    if (links.length >= 5) return toast.error("Maximum 5 links allowed");
    setLinks([...links, ""]);
  }

  function updateLink(index: number, value: string) {
    const updated = [...links];
    updated[index] = value;
    setLinks(updated);
  }

  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index));
  }

  function handleBioChange(value: string) {
    if (countWords(value) <= 100) {
      setBio(value);
    }
  }

  async function uploadAvatar(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    if (file.size > MAX_AVATAR_SIZE) return toast.error("Avatar must be 6 MB or smaller");

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
    toast.success("Avatar uploaded — click Save to apply");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bioWordCount > 100) return toast.error("Bio must be 100 words or fewer");
    setSaving(true);

    const { error } = await createClient()
      .from("profiles")
      .update({
        display_name: displayName,
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
    <form onSubmit={save} className="space-y-8">
      {/* 1. Circle Avatar with Camera Edit & Import */}
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="group relative size-32 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-xl"
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} fill unoptimized className="object-cover" sizes="128px" />
          ) : (
            <div className="grid size-full place-items-center bg-gradient-to-br from-primary/25 to-primary/5 text-3xl font-bold text-primary">
              {getInitials(displayName)}
            </div>
          )}
          <div className="absolute inset-0 grid place-items-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="size-7" />
          </div>
        </button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full text-xs gap-1.5"
            onClick={() => fileInput.current?.click()}
          >
            <Upload className="size-3.5" />
            Import File
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full text-xs gap-1.5"
            onClick={() => fileInput.current?.click()}
          >
            <Camera className="size-3.5" />
            Camera
          </Button>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void uploadAvatar(event.target.files?.[0])}
        />

        <h2 className="text-xl font-bold tracking-tight text-center">{displayName}</h2>
      </div>

      <div className="h-px bg-border" />

      {/* 2. Bio (100 word limit) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Bio</label>
          <span className={`text-xs ${bioWordCount > 90 ? "text-rose-500 font-semibold" : "text-muted-foreground"}`}>
            {bioWordCount}/100 words
          </span>
        </div>
        <Textarea
          rows={3}
          placeholder="Write a short bio about yourself..."
          value={bio}
          onChange={(e) => handleBioChange(e.target.value)}
          className="rounded-xl"
        />
      </div>

      {/* 3. Username */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Username</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">@</span>
          <Input
            required
            minLength={3}
            maxLength={30}
            pattern="[A-Za-z0-9_]+"
            className="pl-7 font-mono text-sm rounded-xl"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Phone */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="tel"
            placeholder="+91 XXXXX XXXXX"
            className="pl-9 rounded-xl"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      {/* 5. Links (optional, max 5) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Links (Optional)</label>
          <span className="text-xs text-muted-foreground">{links.length}/5</span>
        </div>
        {links.map((link, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://example.com"
                className="pl-9 rounded-xl text-sm"
                value={link}
                onChange={(e) => updateLink(index, e.target.value)}
              />
            </div>
            {links.length > 1 && (
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeLink(index)} className="text-rose-500 hover:text-rose-400 shrink-0">
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
        {links.length < 5 && (
          <Button type="button" variant="outline" size="sm" className="rounded-full text-xs gap-1.5" onClick={addLink}>
            <Plus className="size-3.5" />
            Add Link
          </Button>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* 6. Save Changes */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving} className="rounded-full gap-2 font-semibold">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
