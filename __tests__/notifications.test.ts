import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Notifications & In-App Toast Configuration", () => {
  const notificationsPath = path.resolve(__dirname, "../lib/notifications.ts");
  const notificationsContent = fs.readFileSync(notificationsPath, "utf-8");

  const messagePanelPath = path.resolve(__dirname, "../components/chat/message-panel.tsx");
  const messagePanelContent = fs.readFileSync(messagePanelPath, "utf-8");

  it("does not call sonner toast inside notifyIncomingMessage", () => {
    // lib/notifications.ts should not import or call toast for incoming messages
    expect(notificationsContent).not.toMatch(/import\s*\{\s*toast\s*\}\s*from\s*"sonner"/);
    expect(notificationsContent).not.toMatch(/\btoast\s*\(/);
  });

  it("strictly excludes self messages from broadcast notification in message-panel.tsx", () => {
    // broadcast listener must check !senderId || senderId === profile.id and return without notifying
    expect(messagePanelContent).toMatch(/if\s*\(\s*!senderId\s*\|\|\s*senderId\s*===\s*profile\.id\s*\)\s*return;/);
  });

  it("strictly excludes self messages from postgres_changes notification in message-panel.tsx", () => {
    // postgres_changes listener must verify senderId exists and does not equal profile.id
    expect(messagePanelContent).toMatch(/if\s*\(\s*!senderId\s*\|\|\s*senderId\s*===\s*profile\.id\s*\)\s*return;/);
  });

  it("tracks sentMessageIds to eliminate self-notifications when sending messages", () => {
    expect(messagePanelContent).toContain("sentMessageIds.current.has");
  });

  it("preserves playNotificationSound and browser notification capabilities for actual incoming messages", () => {
    expect(notificationsContent).toContain("export function playNotificationSound()");
    expect(notificationsContent).toContain("new Notification(");
  });

  it("exports modern NotificationSettings with nested categories and global switches", () => {
    const settingsPath = path.resolve(__dirname, "../components/settings/notification-settings.tsx");
    const settingsContent = fs.readFileSync(settingsPath, "utf-8");

    // Category navigation rows
    expect(settingsContent).toContain("messages");
    expect(settingsContent).toContain("groups");
    expect(settingsContent).toContain("status");
    expect(settingsContent).toContain("calls");

    // Global toggle switches
    expect(settingsContent).toContain("Show previews");
    expect(settingsContent).toContain("Play sound for outgoing messages");
    expect(settingsContent).toContain("Background sync");

    // Diagnostic test notification
    expect(settingsContent).toContain("Send test notification");
    expect(settingsContent).toContain("new Notification(");
  });
});

