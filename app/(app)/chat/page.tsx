import type { Metadata } from "next";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { getCurrentProfile } from "@/lib/current-user";

export const metadata: Metadata = { title: "Messages" };

export default async function ChatPage() {
  const profile = await getCurrentProfile();
  return <ChatWorkspace profile={profile} />;
}
