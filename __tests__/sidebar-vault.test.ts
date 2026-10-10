import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Sidebar Vault Navigation & Dedicated Vault View", () => {
  const navRailPath = path.resolve(__dirname, "../components/chat/navigation-rail.tsx");
  const navRailContent = fs.readFileSync(navRailPath, "utf-8");

  const mobileNavPath = path.resolve(__dirname, "../components/chat/mobile-bottom-nav.tsx");
  const mobileNavContent = fs.readFileSync(mobileNavPath, "utf-8");

  const sidebarPath = path.resolve(__dirname, "../components/chat/conversation-sidebar.tsx");
  const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

  const vaultViewPath = path.resolve(__dirname, "../components/chat/vault-view.tsx");
  const vaultViewContent = fs.readFileSync(vaultViewPath, "utf-8");

  it("renames Media tab to Vault with Vault icon in left navigation rail", () => {
    expect(navRailContent).toContain('label: "Vault"');
    expect(navRailContent).toContain('icon: Vault');
    expect(navRailContent).toContain('id: "vault"');
    expect(navRailContent).toContain("Vault,");
  });

  it("keeps Vault desktop-only and restricts mobile bottom nav to exactly 4 items in a floating pill", () => {
    expect(mobileNavContent).not.toContain('id: "vault"');
    expect(mobileNavContent).not.toContain('label: "Vault"');
    expect(mobileNavContent).toContain('id: "chats"');
    expect(mobileNavContent).toContain('id: "calls"');
    expect(mobileNavContent).toContain('id: "status"');
    expect(mobileNavContent).toContain('id: "settings"');
    expect(mobileNavContent).toContain("rounded-full");
    expect(mobileNavContent).toContain("bg-[#182229]/80");
    expect(mobileNavContent).toContain("backdrop-blur-xl");
    expect(mobileNavContent).toContain("border border-white/10");
  });

  it("renders VaultView inside conversation sidebar when vault tab is active", () => {
    expect(sidebarContent).toContain('import { VaultView } from "@/components/chat/vault-view"');
    expect(sidebarContent).toContain('currentTab === "vault"');
    expect(sidebarContent).toContain("<VaultView");
  });

  it("contains 3 segmented filter tabs: Media, Docs, and Links", () => {
    expect(vaultViewContent).toContain('setActiveTab("media")');
    expect(vaultViewContent).toContain('setActiveTab("docs")');
    expect(vaultViewContent).toContain('setActiveTab("links")');
    expect(vaultViewContent).toContain("Media</span>");
    expect(vaultViewContent).toContain("Docs</span>");
    expect(vaultViewContent).toContain("Links</span>");
  });

  it("integrates full-screen media lightbox for Media grid items", () => {
    expect(vaultViewContent).toContain("WhatsAppMediaLightbox");
    expect(vaultViewContent).toContain("handleOpenLightbox");
    expect(vaultViewContent).toContain("lightboxOpen");
    expect(vaultViewContent).toContain("activeMediaId");
    expect(vaultViewContent).toContain("conversationMediaMessages={lightboxMediaMessages}");
  });

  it("supports documents with extension icons, file size metadata, and direct download links", () => {
    expect(vaultViewContent).toContain("getDocIcon");
    expect(vaultViewContent).toContain("formatFileSize");
    expect(vaultViewContent).toContain("download={file.attachment_name}");
    expect(vaultViewContent).toContain("<Download");
  });

  it("automatically displays shared links with domain, title, and external link icon", () => {
    expect(vaultViewContent).toContain("link.domain");
    expect(vaultViewContent).toContain("<ExternalLink");
    expect(vaultViewContent).toContain('target="_blank"');
    expect(vaultViewContent).toContain('rel="noopener noreferrer"');
  });

  it("features an in-panel search bar filtering items by name or chat", () => {
    expect(vaultViewContent).toContain("searchQuery");
    expect(vaultViewContent).toContain("Filter by name or chat...");
    expect(vaultViewContent).toContain("filteredMedia");
    expect(vaultViewContent).toContain("filteredDocs");
    expect(vaultViewContent).toContain("filteredLinks");
    expect(vaultViewContent).toContain("chat_title");
  });
});
