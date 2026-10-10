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
    expect(sidebarContent).toContain("chat-time text-xs text-neutral-400 shrink-0 flex-shrink-0 font-medium");
    // Preview truncate block w-full min-w-0
    expect(sidebarContent).toContain("truncate block w-full min-w-0");
    // Contact title scaled up
    expect(sidebarContent).toContain("user-name text-[15px] sm:text-base font-semibold truncate block");
    // Bottom padding pb-28 md:pb-6 for floating nav clearance
    expect(sidebarContent).toContain("pb-28 md:pb-6");
  });

  it("prevents text bubble collapsing on short messages with min-w-[90px] w-fit max-w-[75%] and break-words", () => {
    const bubblePath = path.resolve(__dirname, "../components/chat/message-bubble.tsx");
    const bubbleContent = fs.readFileSync(bubblePath, "utf-8");

    expect(bubbleContent).toContain("min-w-[90px] w-fit max-w-[75%]");
    expect(bubbleContent).toContain("break-words");
    expect(bubbleContent).toContain("whitespace-nowrap");
  });

  it("ensures Poll card has responsive width with box-border and chat container has px-4 and overflow-x-hidden", () => {
    const pollPath = path.resolve(__dirname, "../components/chat/media/poll-card.tsx");
    const pollContent = fs.readFileSync(pollPath, "utf-8");

    expect(pollContent).toContain("w-full max-w-[360px] sm:max-w-[400px]");
    expect(pollContent).toContain("box-border");

    const panelPath = path.resolve(__dirname, "../components/chat/message-panel.tsx");
    const panelContent = fs.readFileSync(panelPath, "utf-8");

    expect(panelContent).toContain("px-4");
    expect(panelContent).toContain("overflow-x-hidden overflow-y-auto");
  });
});
