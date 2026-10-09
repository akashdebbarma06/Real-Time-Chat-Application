import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Chat Layout Overflow Protection Rules", () => {
  const cssPath = path.resolve(__dirname, "../app/globals.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  it("defines .sidebar with fixed width boundaries, flex-shrink: 0, and overflow: hidden", () => {
    expect(cssContent).toMatch(/\.sidebar\s*\{[^}]*flex-shrink:\s*0/);
    expect(cssContent).toMatch(/\.sidebar\s*\{[^}]*overflow:\s*hidden/);
  });

  it("defines .sidebar-item-content with min-width: 0 for nested flex containment", () => {
    expect(cssContent).toMatch(/\.sidebar-item-content\s*\{[^}]*min-width:\s*0/);
  });

  it("defines .sidebar-message-preview with single-line ellipsis truncation rules", () => {
    expect(cssContent).toMatch(/\.sidebar-message-preview\s*\{[^}]*white-space:\s*nowrap/);
    expect(cssContent).toMatch(/\.sidebar-message-preview\s*\{[^}]*overflow:\s*hidden/);
    expect(cssContent).toMatch(/\.sidebar-message-preview\s*\{[^}]*text-overflow:\s*ellipsis/);
    expect(cssContent).toMatch(/\.sidebar-message-preview\s*\{[^}]*min-width:\s*0/);
  });

  it("defines .sidebar-last-message with natural full width ellipsis truncation", () => {
    expect(cssContent).toMatch(/\.sidebar-last-message\s*\{[^}]*display:\s*block/);
    expect(cssContent).toMatch(/\.sidebar-last-message\s*\{[^}]*width:\s*100%/);
    expect(cssContent).toMatch(/\.sidebar-last-message\s*\{[^}]*white-space:\s*nowrap/);
    expect(cssContent).toMatch(/\.sidebar-last-message\s*\{[^}]*text-overflow:\s*ellipsis/);
  });

  it("defines .chat-bubble with word-break: break-word, overflow-wrap: break-word, and max-width: 70%", () => {
    expect(cssContent).toMatch(/\.chat-bubble\s*\{[^}]*word-break:\s*break-word/);
    expect(cssContent).toMatch(/\.chat-bubble\s*\{[^}]*overflow-wrap:\s*break-word/);
    expect(cssContent).toMatch(/\.chat-bubble\s*\{[^}]*max-width:\s*70%/);
  });

  it("ensures radix scroll area viewport inner container is block with min-width: 0", () => {
    expect(cssContent).toMatch(/\[data-radix-scroll-area-viewport\]\s*>\s*div\s*\{[^}]*display:\s*block/);
    expect(cssContent).toMatch(/\[data-radix-scroll-area-viewport\]\s*>\s*div\s*\{[^}]*min-width:\s*0/);
  });

  it("structures conversation sidebar cards with flex-shrink-0 avatar/time and min-w-0 preview", () => {
    const sidebarPath = path.resolve(__dirname, "../components/chat/conversation-sidebar.tsx");
    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

    // Avatar shrink-0
    expect(sidebarContent).toContain("shrink-0 flex-shrink-0");
    // Middle container flex-1 min-w-0 overflow-hidden
    expect(sidebarContent).toContain("sidebar-item-content chat-info flex-1 min-w-0 flex flex-col justify-center gap-0.5 overflow-hidden");
    // Timestamp shrink-0
    expect(sidebarContent).toContain("chat-time text-[11px] text-muted-foreground shrink-0 flex-shrink-0");
    // Preview truncate block w-full min-w-0
    expect(sidebarContent).toContain("truncate block w-full min-w-0");
  });
});
