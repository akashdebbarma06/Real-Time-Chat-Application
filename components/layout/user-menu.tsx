"use client";

import Link from "next/link";
import { LogOut, Settings, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/chat";

export function UserMenu({ profile }: { profile: Profile }) {
  async function logout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch("/auth/signout", { method: "POST" });
    } catch {
      // Ignore network errors on signout
    }
    window.location.href = "/login";
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 text-left outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-8 border shadow-sm">
          <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
          <AvatarFallback className="text-xs">{getInitials(profile.display_name)}</AvatarFallback>
        </Avatar>
        <Settings className="size-4 text-muted-foreground hover:text-foreground transition-colors mr-1" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60" align="end" side="bottom">
        <DropdownMenuLabel>
          <span className="block truncate text-sm font-semibold text-foreground">{profile.display_name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">@{profile.username}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
            <UserRound className="size-4" />
            <span>Account & Profile Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="size-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
