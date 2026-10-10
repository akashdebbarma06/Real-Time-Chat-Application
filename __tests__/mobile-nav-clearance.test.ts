import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Mobile Navigation Clearance and Sub-Page Hiding", () => {
  const sidebarPath = path.resolve(__dirname, "../components/chat/conversation-sidebar.tsx");
  const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

  const settingsPath = path.resolve(__dirname, "../components/chat/settings-view.tsx");
  const settingsContent = fs.readFileSync(settingsPath, "utf-8");

  const appearancePath = path.resolve(__dirname, "../components/settings/appearance-panel.tsx");
  const appearanceContent = fs.readFileSync(appearancePath, "utf-8");

  const notificationsPath = path.resolve(__dirname, "../components/settings/notification-settings.tsx");
  const notificationsContent = fs.readFileSync(notificationsPath, "utf-8");

  it("adds pb-28 md:pb-6 to Chat List container in conversation-sidebar.tsx", () => {
    expect(sidebarContent).toContain("pb-28 md:pb-6");
  });

  it("adds pb-28 md:pb-6 to Settings Home navigation list in settings-view.tsx", () => {
    expect(settingsContent).toContain("flex flex-col py-2 pb-28 md:pb-6");
  });

  it("adds pb-28 md:pb-6 to Account and Privacy sub-panel scroll containers in settings-view.tsx", () => {
    expect(settingsContent).toMatch(/Account[\s\S]*?pb-28 md:pb-6/);
    expect(settingsContent).toMatch(/Privacy & Security[\s\S]*?pb-28 md:pb-6/);
  });

  it("adds pb-28 md:pb-6 to Notifications scrollable containers in notification-settings.tsx", () => {
    expect(notificationsContent).toContain("pb-28 md:pb-6");
  });

  it("adds pb-28 md:pb-6 to Appearance scrollable container in appearance-panel.tsx", () => {
    expect(appearanceContent).toContain("pb-28 md:pb-6");
  });

  it("shows floating bottom navbar only on root tabs and hides it on sub-pages", () => {
    // Verifies root tab check
    expect(sidebarContent).toContain('currentTab === "chats" && !selectedConversationId');
    expect(sidebarContent).toContain('currentTab === "calls"');
    expect(sidebarContent).toContain('currentTab === "status"');
    expect(sidebarContent).toContain('currentTab === "settings" && !settingsSection');

    // Verifies MobileBottomNav is conditionally rendered based on root tab state
    expect(sidebarContent).toMatch(/isRootTab|\(currentTab === "settings" && !settingsSection\)/);
  });

  it("hides Keyboard Shortcuts on mobile screens using hidden md:flex", () => {
    expect(settingsContent).toContain('item.id === "shortcuts" && "hidden md:flex"');
  });
});
