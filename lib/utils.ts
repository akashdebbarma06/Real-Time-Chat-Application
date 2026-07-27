import { clsx, type ClassValue } from "clsx";
import { format, isToday, isYesterday } from "date-fns";
import { twMerge } from "tailwind-merge";
import type { ConversationSummary, Profile } from "@/types/chat";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CS";
}

export function formatMessageTime(value: string) {
  const date = new Date(value);
  if (isToday(date)) return format(date, "p");
  if (isYesterday(date)) return `Yesterday ${format(date, "p")}`;
  return format(date, "MMM d, p");
}

export function formatConversationTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (isToday(date)) return format(date, "p");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function getConversationTitle(conversation: ConversationSummary, userId: string) {
  if (conversation.type === "group") return conversation.name || "Untitled group";
  return conversation.members.find((member) => member.user_id !== userId)?.profile.display_name || "Direct message";
}

export function getConversationAvatar(conversation: ConversationSummary, userId: string) {
  if (conversation.type === "group") return conversation.avatar_url;
  return conversation.members.find((member) => member.user_id !== userId)?.profile.avatar_url || null;
}

export function getConversationPeers(conversation: ConversationSummary, userId: string): Profile[] {
  return conversation.members.filter((member) => member.user_id !== userId).map((member) => member.profile);
}

export function sanitizeFilename(filename: string) {
  const parts = filename.split(".");
  const extension = parts.length > 1 ? `.${parts.pop()?.toLowerCase().replace(/[^a-z0-9]/g, "")}` : "";
  const base = parts.join(".").replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").slice(0, 80);
  return `${base || "file"}${extension}`;
}
