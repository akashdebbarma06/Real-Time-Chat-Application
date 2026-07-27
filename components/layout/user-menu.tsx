"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

export function UserMenu({ profile }: { profile: Profile }) {
  const router = useRouter();

  async function logout() {
    const { error } = await createClient().auth.signOut();
    if (error) return toast.error(error.message);
    router.replace("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl p-2 text-left outline-none transition hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar><AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} /><AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback></Avatar>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{profile.display_name}</span><span className="block truncate text-xs text-muted-foreground">@{profile.username}</span></span>
        <Settings className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" side="top">
        <DropdownMenuLabel><span className="block truncate text-sm text-foreground">{profile.display_name}</span><span className="block truncate font-normal">@{profile.username}</span></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/profile"><UserRound />Edit profile</Link></DropdownMenuItem>
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive"><LogOut />Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
