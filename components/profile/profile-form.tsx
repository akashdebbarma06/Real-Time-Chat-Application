"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { getInitials, sanitizeFilename } from "@/lib/utils";
import type { Profile } from "@/types/chat";

const MAX_AVATAR_SIZE = 6 * 1024 * 1024;

export function ProfileForm({ profile }: { profile: Profile }) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function uploadAvatar(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    if (file.size > MAX_AVATAR_SIZE) return toast.error("Avatar images must be 6 MB or smaller");

    setSaving(true);
    const supabase = createClient();
    const path = `${profile.id}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });
    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setSaving(false);
    toast.success("Avatar ready—save your profile to apply it");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const { error } = await createClient().from("profiles").update({
      display_name: displayName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl,
      last_seen_at: new Date().toISOString(),
    }).eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  }

  return (
    <form onSubmit={save} className="rounded-3xl border bg-card p-6 shadow-xl shadow-black/5 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <button type="button" onClick={() => fileInput.current?.click()} className="group relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary/25 to-primary/5 text-2xl font-semibold text-primary ring-1 ring-border">
          {avatarUrl ? <Image src={avatarUrl} alt={displayName} fill unoptimized className="object-cover" sizes="96px" /> : getInitials(displayName)}
          <span className="absolute inset-0 grid place-items-center bg-black/55 text-white opacity-0 transition group-hover:opacity-100"><Camera /></span>
        </button>
        <div><h2 className="text-xl font-semibold">Public profile</h2><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Your name, username, avatar, and bio are visible to signed-in ChatSphere users.</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => fileInput.current?.click()}><Camera />Change avatar</Button></div>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(event) => void uploadAvatar(event.target.files?.[0])} />
      </div>

      <div className="my-8 h-px bg-border" />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">Display name<Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={1} maxLength={80} /></label>
        <label className="grid gap-2 text-sm font-medium">Username<Input value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" /></label>
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">Bio<Textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={300} rows={5} placeholder="Tell people a little about yourself" /><span className="text-right text-xs font-normal text-muted-foreground">{bio.length}/300</span></label>
      </div>
      <div className="mt-6 flex justify-end"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />}Save changes</Button></div>
    </form>
  );
}
