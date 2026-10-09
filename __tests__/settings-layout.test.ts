import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("WhatsApp Web Settings Panel Layout & Styling", () => {
  const settingsPath = path.resolve(__dirname, "../components/chat/settings-view.tsx");
  const settingsContent = fs.readFileSync(settingsPath, "utf-8");

  it("includes WhatsApp-style search settings input", () => {
    expect(settingsContent).toContain("Search settings");
    expect(settingsContent).toContain("searchQuery");
  });

  it("renders a WhatsApp-style user profile header with status", () => {
    expect(settingsContent).toContain('href="/profile"');
    expect(settingsContent).toContain("profile.display_name");
    expect(settingsContent).toContain("profile.bio");
  });

  it("orders settings items in official WhatsApp Web sequence", () => {
    const accountIndex = settingsContent.indexOf('id: "account"');
    const privacyIndex = settingsContent.indexOf('id: "privacy"');
    const appearanceIndex = settingsContent.indexOf('id: "appearance"');
    const notificationsIndex = settingsContent.indexOf('id: "notifications"');
    const languageIndex = settingsContent.indexOf('id: "language"');
    const inviteIndex = settingsContent.indexOf('id: "invite"');
    const helpIndex = settingsContent.indexOf('id: "help"');

    expect(accountIndex).toBeGreaterThan(-1);
    expect(privacyIndex).toBeGreaterThan(accountIndex);
    expect(appearanceIndex).toBeGreaterThan(privacyIndex);
    expect(notificationsIndex).toBeGreaterThan(appearanceIndex);
    expect(languageIndex).toBeGreaterThan(notificationsIndex);
    expect(inviteIndex).toBeGreaterThan(languageIndex);
    expect(helpIndex).toBeGreaterThan(inviteIndex);
  });

  it("uses flat borderless list layout and WhatsApp dark color palette (#111b21, #202c33, #222e35)", () => {
    expect(settingsContent).toContain("bg-[#111b21]");
    expect(settingsContent).toContain("text-[#e9edef]");
    expect(settingsContent).toContain("hover:bg-[#202c33]");
    expect(settingsContent).toContain("border-[#222e35]");
  });

  it("renders a clean text-based log out button in muted red (#ea4335)", () => {
    expect(settingsContent).toContain("text-[#ea4335]");
    expect(settingsContent).toContain("Log out");
  });
});
