import { describe, expect, it } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { LocationCard, parseLocationMessage } from "@/components/chat/media/location-card";
import { MobileBottomNav } from "@/components/chat/mobile-bottom-nav";

describe("AetherChat Android UI Bug Fixes Specification Suite", () => {
  describe("Bug 1: Bottom Navigation Bar Theme Adaptation", () => {
    it("renders MobileBottomNav with semantic theme-adaptive classes", () => {
      const { container } = render(
        <MobileBottomNav activeTab="chats" onTabChange={() => {}} unreadChatsCount={2} />
      );

      const navElement = container.querySelector("nav");
      expect(navElement).not.toBeNull();
      const navClass = navElement?.className || "";

      // Must anchor to bottom edge with slate blur and top border
      expect(navClass).toContain("bg-[#0F1115]/90");
      expect(navClass).toContain("border-t");
      expect(navClass).toContain("md:hidden");

      // Inactive items must use semantic muted-foreground rather than hardcoded zinc-400
      expect(container.innerHTML).toContain("text-muted-foreground");
      expect(container.innerHTML).not.toContain("text-zinc-400 hover:text-zinc-200");

      // Active tab (chats) must have primary styling
      const chatsButton = screen.getByRole("button", { name: "Chats" });
      expect(chatsButton.className).toContain("text-primary");
    });
  });

  describe("Bug 2: Chat Header Safe Area & Status Bar Clearance", () => {
    it("verifies MessagePanel uses h-full flex-1 instead of h-svh to respect safe-area container", () => {
      const panelPath = path.resolve(__dirname, "../components/chat/message-panel.tsx");
      const panelContent = fs.readFileSync(panelPath, "utf-8");

      expect(panelContent).toContain(
        '<section className="flex h-full min-h-0 flex-1 flex-col bg-background relative overflow-hidden">'
      );
      expect(panelContent).not.toContain(
        '<section className="flex h-svh min-h-0 flex-col bg-background relative overflow-hidden">'
      );
    });

    it("verifies chat-workspace.tsx includes safe-area-pt on main layout", () => {
      const workspacePath = path.resolve(__dirname, "../components/chat/chat-workspace.tsx");
      const workspaceContent = fs.readFileSync(workspacePath, "utf-8");

      expect(workspaceContent).toContain("safe-area-pt");
    });

    it("verifies MainActivity.java dynamically binds WindowInsets to --safe-area-inset-top", () => {
      const mainActivityPath = path.resolve(
        __dirname,
        "../android/app/src/main/java/com/aetherchat/app/MainActivity.java"
      );
      const activityContent = fs.readFileSync(mainActivityPath, "utf-8");

      expect(activityContent).toContain("setupWindowInsets();");
      expect(activityContent).toContain("ViewCompat.setOnApplyWindowInsetsListener");
      expect(activityContent).toContain("--safe-area-inset-top");
      expect(activityContent).toContain("--safe-area-inset-bottom");
    });

    it("verifies AppProviders includes NativeSafeAreasInitializer for instant Android platform fallback", () => {
      const providersPath = path.resolve(__dirname, "../components/providers/app-providers.tsx");
      const providersContent = fs.readFileSync(providersPath, "utf-8");

      expect(providersContent).toContain("NativeSafeAreasInitializer");
      expect(providersContent).toContain("--safe-area-inset-top");
    });
  });

  describe("Bug 3: Location Message Cards & Contrast Across Themes", () => {
    it("renders LocationCard with high contrast semantic theme tokens for own messages", () => {
      const { container } = render(
        <LocationCard
          latitude={23.8315}
          longitude={91.2868}
          address="Ujjayanta Palace, Agartala"
          own={true}
        />
      );

      // Card surface must use bg-card and text-card-foreground
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain("bg-card");
      expect(card.className).toContain("text-card-foreground");
      expect(card.className).not.toContain("bg-primary-foreground/10 text-primary-foreground");

      // Title & Address must be high contrast text-foreground
      const title = screen.getByText("Ujjayanta Palace, Agartala");
      expect(title.className).toContain("text-foreground");

      // Open in Maps button must have high-contrast bg-primary and text-primary-foreground
      const mapBtn = screen.getByRole("link", { name: /Open in Maps/i });
      expect(mapBtn.className).toContain("bg-primary");
      expect(mapBtn.className).toContain("text-primary-foreground");
      expect(mapBtn.getAttribute("href")).toBe("https://www.google.com/maps?q=23.8315,91.2868");

      // Coordinates pill on map graphic must have dark backdrop and high-contrast white text
      const coordPill = container.querySelector(".bg-black\\/80");
      expect(coordPill).not.toBeNull();
      expect(coordPill?.textContent).toContain("23.8315, 91.2868");
    });

    it("renders LocationCard with high contrast for received messages without clipping coordinates", () => {
      const { container } = render(
        <LocationCard
          latitude={12.9716}
          longitude={77.5946}
          address="Bangalore City Center"
          own={false}
        />
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain("bg-card");
      expect(card.className).toContain("border-border/80");

      expect(screen.getByText("Bangalore City Center")).toBeDefined();
      expect(screen.getByText(/12\.97160,\s*77\.59460/)).toBeDefined();
    });

    it("parses valid coordinates and preserves location integrity", () => {
      const jsonContent = JSON.stringify({
        type: "location",
        latitude: 40.7128,
        longitude: -74.006,
        address: "New York, NY",
      });
      const parsed = parseLocationMessage(jsonContent);
      expect(parsed).not.toBeNull();
      expect(parsed?.latitude).toBe(40.7128);
      expect(parsed?.longitude).toBe(-74.006);
      expect(parsed?.address).toBe("New York, NY");
    });
  });
});
