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

  it("renders a scrollable WhatsApp-style hero profile banner opening in side panel with 24h note cloud bubble and 96px avatar", () => {
    expect(settingsContent).not.toContain('href="/profile"');
    expect(settingsContent).toContain('setSelectedSection("profile")');
    expect(settingsContent).toContain("selectedSection === \"profile\"");
    expect(settingsContent).toContain("NoteStatusDialog");
    expect(settingsContent).toContain("noteStatus");
    expect(settingsContent).toContain("size-24");
    expect(settingsContent).toContain("Camera");
    expect(settingsContent).toContain("@{profile.username");
    expect(settingsContent).toContain("›");
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

  it("uses flat borderless list layout with dynamic semantic theme tokens", () => {
    expect(settingsContent).toContain("bg-background");
    expect(settingsContent).toContain("text-foreground");
    expect(settingsContent).toContain("hover:bg-muted");
    expect(settingsContent).toContain("border-border");
  });

  it("renders a clean text-based log out button with destructive theme token", () => {
    expect(settingsContent).toContain("text-destructive");
    expect(settingsContent).toContain("Log out");
  });

  it("includes top-level settings pages for Chats, Storage & Data, and Keyboard Shortcuts", () => {
    expect(settingsContent).toContain('id: "chats"');
    expect(settingsContent).toContain('id: "storage"');
    expect(settingsContent).toContain('id: "shortcuts"');
    expect(settingsContent).toContain("ChatsSettings");
    expect(settingsContent).toContain("StorageSettings");
    expect(settingsContent).toContain("KeyboardShortcutsDialog");
  });

  it("verifies Chats settings page features (Enter is send, Keep chats archived, Media auto-download)", () => {
    const chatsPath = path.resolve(__dirname, "../components/settings/chats-settings.tsx");
    const chatsContent = fs.readFileSync(chatsPath, "utf-8");
    expect(chatsContent).toContain("Enter is send");
    expect(chatsContent).toContain("Keep chats archived");
    expect(chatsContent).toContain("Media auto-download");
    expect(chatsContent).toContain("chat_enter_is_send");
    expect(chatsContent).toContain("chat_keep_archived");
  });

  it("verifies Storage & Data settings page features (Cache breakdown bar, Photos, Videos, Files, Clear cache)", () => {
    const storagePath = path.resolve(__dirname, "../components/settings/storage-settings.tsx");
    const storageContent = fs.readFileSync(storagePath, "utf-8");
    expect(storageContent).toContain("Storage & Data");
    expect(storageContent).toContain("Clear Cache");
    expect(storageContent).toContain("Photos");
    expect(storageContent).toContain("Videos");
    expect(storageContent).toContain("Files");
  });

  it("verifies Privacy & Security enhancements (Read receipts, Default message timer, Linked Devices)", () => {
    expect(settingsContent).toContain("Read receipts");
    expect(settingsContent).toContain("Default message timer");
    expect(settingsContent).toContain("Linked Devices");
    expect(settingsContent).toContain("privacy_read_receipts");
    expect(settingsContent).toContain("privacy_disappearing_timer");
  });

  it("verifies Appearance enhancements (App icon swatches, Desktop Chat View)", () => {
    const appearancePath = path.resolve(__dirname, "../components/settings/appearance-panel.tsx");
    const appearanceContent = fs.readFileSync(appearancePath, "utf-8");
    expect(appearanceContent).toContain("App Icon");
    expect(appearanceContent).toContain("Chat View");
    expect(appearanceContent).toContain("Single chat");
    expect(appearanceContent).toContain("Multi chat");
  });

  it("restricts Invite a Friend to mobile viewports with block md:hidden", () => {
    expect(settingsContent).toContain('item.id === "invite" && "block md:hidden"');
  });

  it("hides Keyboard Shortcuts on mobile screens with hidden md:flex", () => {
    expect(settingsContent).toContain('item.id === "shortcuts" && "hidden md:flex"');
  });

  it("applies pb-28 md:pb-6 to Settings Home and nested sub-panels for mobile clearance", () => {
    // Settings home list
    expect(settingsContent).toContain("pb-28 md:pb-6");
    // Account subpanel
    expect(settingsContent).toMatch(/Account[\s\S]*?pb-28 md:pb-6/);
    // Privacy subpanel
    expect(settingsContent).toMatch(/Privacy & Security[\s\S]*?pb-28 md:pb-6/);
  });

  it("integrates WhatsApp profile picture slide-up action sheet in Profile view and settings banner", () => {
    expect(settingsContent).toContain("ProfilePhotoSheet");
    expect(settingsContent).toContain("photoSheetOpen");
    expect(settingsContent).toContain("setPhotoSheetOpen(true)");
    expect(settingsContent).toContain("CameraCaptureDialog");
    expect(settingsContent).toContain("handleSelectDefaultAvatar");
    expect(settingsContent).toContain("handleRemoveAvatar");
    expect(settingsContent).toContain("onRemovePhoto");
    expect(settingsContent).toContain(".toUpperCase()");

    const sheetPath = path.resolve(__dirname, "../components/settings/profile-photo-sheet.tsx");
    const sheetContent = fs.readFileSync(sheetPath, "utf-8");

    // Action sheet styling & header
    expect(sheetContent).toContain("rounded-t-3xl");
    expect(sheetContent).toContain("Profile picture");
    expect(sheetContent).toContain("slide-in-from-bottom");

    // 4 Options including Remove
    expect(sheetContent).toContain("Camera");
    expect(sheetContent).toContain("Gallery");
    expect(sheetContent).toContain("Select Default");
    expect(sheetContent).toContain("Remove");
    expect(sheetContent).toContain("Trash2");
    expect(sheetContent).toContain("onRemovePhoto");

    // Gallery restricted strictly to photos
    expect(sheetContent).toContain('accept="image/png, image/jpeg, image/webp"');

    // Default Avatar SVG Data URL generator
    expect(sheetContent).toContain("generateDefaultAvatarSvg");
    expect(sheetContent).toContain("data:image/svg+xml;utf8");
    expect(sheetContent).toContain("🦊");
    expect(sheetContent).toContain("🐼");
    expect(sheetContent).toContain("🐱");
    expect(sheetContent).toContain("🚀");
    expect(sheetContent).toContain("⭐");
  });

  it("configures transparent vector favicon.svg with cache-busting in layout", () => {
    const layoutPath = path.resolve(__dirname, "../app/layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    expect(layoutContent).toContain('/favicon.svg?v=2');
    expect(layoutContent).toContain('image/svg+xml');

    const faviconPath = path.resolve(__dirname, "../public/favicon.svg");
    expect(fs.existsSync(faviconPath)).toBe(true);
    const faviconContent = fs.readFileSync(faviconPath, "utf-8");
    expect(faviconContent).toContain("<svg");
    expect(faviconContent).toContain("#00A884");
    expect(faviconContent).toContain("<rect");
    expect(faviconContent).toContain("<circle");
  });
});



