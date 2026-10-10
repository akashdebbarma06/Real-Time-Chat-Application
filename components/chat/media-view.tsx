"use client";

import { VaultView } from "@/components/chat/vault-view";
import type { ConversationSummary, Profile } from "@/types/chat";

export { VaultView } from "@/components/chat/vault-view";

export interface MediaViewProps {
  conversations: ConversationSummary[];
  profile: Profile;
}

export function MediaView({ conversations, profile }: MediaViewProps) {
  return <VaultView conversations={conversations} profile={profile} />;
}
