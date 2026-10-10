import { describe, expect, it, vi, beforeEach } from "vitest";
import { backButtonManager, type BackHandler } from "../lib/navigation/back-button-manager";
import fs from "fs";
import path from "path";

describe("Mobile Hardware and Browser Back-Button Navigation Stack", () => {
  beforeEach(() => {
    backButtonManager.clear();
    vi.restoreAllMocks();
  });

  describe("Hierarchical Dismiss Order (Priorities 1, 2, 3, 4)", () => {
    it("strictly follows the 4-tier dismiss order: Modal (100) -> Drawer (50) -> Active Conversation (25) -> Root View (0)", () => {
      const modalClosed = vi.fn();
      const drawerClosed = vi.fn();
      const conversationClosed = vi.fn();

      // Register in reverse/random order to test priority sorting
      const unregConvo = backButtonManager.register({
        id: "active-conversation",
        priority: 25,
        handleBack: conversationClosed,
      });

      const unregModal = backButtonManager.register({
        id: "media-lightbox-modal",
        priority: 100,
        handleBack: modalClosed,
      });

      const unregDrawer = backButtonManager.register({
        id: "contact-info-drawer",
        priority: 50,
        handleBack: drawerClosed,
      });

      // 1. First back press MUST dismiss Priority 1 (Modal)
      const handled1 = backButtonManager.triggerBack();
      expect(handled1).toBe(true);
      expect(modalClosed).toHaveBeenCalledTimes(1);
      expect(drawerClosed).not.toHaveBeenCalled();
      expect(conversationClosed).not.toHaveBeenCalled();

      // Modal unregisters after closing
      unregModal();

      // 2. Second back press MUST dismiss Priority 2 (Drawer/Sub-Panel)
      const handled2 = backButtonManager.triggerBack();
      expect(handled2).toBe(true);
      expect(drawerClosed).toHaveBeenCalledTimes(1);
      expect(conversationClosed).not.toHaveBeenCalled();

      // Drawer unregisters after closing
      unregDrawer();

      // 3. Third back press MUST close Priority 3 (Active Conversation) and return to Chat List
      const handled3 = backButtonManager.triggerBack();
      expect(handled3).toBe(true);
      expect(conversationClosed).toHaveBeenCalledTimes(1);

      // Conversation unregisters after returning to chat list
      unregConvo();

      // 4. Fourth back press reaches Priority 4 (Root View) -> not handled by app stack
      const handled4 = backButtonManager.triggerBack();
      expect(handled4).toBe(false); // Allows default exit/minimize behavior
    });

    it("respects sub-priorities: editing tools (110) dismiss before modal (100), and group permissions (60) before drawer (50)", () => {
      const toolClosed = vi.fn();
      const modalClosed = vi.fn();
      const permSubViewClosed = vi.fn();
      const groupDrawerClosed = vi.fn();

      backButtonManager.register({
        id: "media-editor-tool-popups",
        priority: 110,
        handleBack: toolClosed,
      });

      backButtonManager.register({
        id: "photos-videos-preview-dialog",
        priority: 100,
        handleBack: modalClosed,
      });

      backButtonManager.register({
        id: "in-panel-group-subview",
        priority: 60,
        handleBack: permSubViewClosed,
      });

      backButtonManager.register({
        id: "group-info-drawer",
        priority: 50,
        handleBack: groupDrawerClosed,
      });

      // First back press closes tool popups first
      expect(backButtonManager.triggerBack()).toBe(true);
      expect(toolClosed).toHaveBeenCalledTimes(1);
      expect(modalClosed).not.toHaveBeenCalled();

      backButtonManager.unregister("media-editor-tool-popups");

      // Next press closes modal
      expect(backButtonManager.triggerBack()).toBe(true);
      expect(modalClosed).toHaveBeenCalledTimes(1);

      backButtonManager.unregister("photos-videos-preview-dialog");

      // Next press closes group sub-view (permissions)
      expect(backButtonManager.triggerBack()).toBe(true);
      expect(permSubViewClosed).toHaveBeenCalledTimes(1);

      backButtonManager.unregister("in-panel-group-subview");

      // Next press closes group drawer
      expect(backButtonManager.triggerBack()).toBe(true);
      expect(groupDrawerClosed).toHaveBeenCalledTimes(1);
    });
  });

  describe("DOM Fallback for Radix Dialog Modals", () => {
    it("dispatches Escape event if an unmanaged open dialog exists in DOM", () => {
      // Mock an open dialog element in DOM
      const dialog = document.createElement("div");
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("data-state", "open");
      document.body.appendChild(dialog);

      let escapeFired = false;
      const keyHandler = (e: KeyboardEvent) => {
        if (e.key === "Escape") escapeFired = true;
      };
      document.addEventListener("keydown", keyHandler);

      const handled = backButtonManager.triggerBack();
      expect(handled).toBe(true);
      expect(escapeFired).toBe(true);

      document.removeEventListener("keydown", keyHandler);
      document.body.removeChild(dialog);
    });
  });

  describe("Component Integration Verification", () => {
    it("verifies ChatWorkspace registers sideDetailView (50) and active mobile conversation (25)", () => {
      const workspacePath = path.resolve(__dirname, "../components/chat/chat-workspace.tsx");
      const content = fs.readFileSync(workspacePath, "utf-8");

      expect(content).toContain("useBackHandler");
      expect(content).toContain('id: "chat-side-detail-view"');
      expect(content).toContain("priority: 50");
      expect(content).toContain('id: "chat-active-conversation-mobile"');
      expect(content).toContain("priority: 25");
      expect(content).toContain('router.push("/chat")');
    });

    it("verifies SettingsView registers sub-panel dismissal (50)", () => {
      const settingsPath = path.resolve(__dirname, "../components/chat/settings-view.tsx");
      const content = fs.readFileSync(settingsPath, "utf-8");

      expect(content).toContain("useBackHandler");
      expect(content).toContain('id: "settings-sub-panel"');
      expect(content).toContain("priority: 50");
      expect(content).toContain("setSelectedSection(null)");
    });

    it("verifies ConversationSidebar registers subviews (50) and mobile tab return (40)", () => {
      const sidebarPath = path.resolve(__dirname, "../components/chat/conversation-sidebar.tsx");
      const content = fs.readFileSync(sidebarPath, "utf-8");

      expect(content).toContain("useBackHandler");
      expect(content).toContain('id: "sidebar-subview"');
      expect(content).toContain("priority: 50");
      expect(content).toContain('id: "sidebar-mobile-tab-switch"');
      expect(content).toContain("priority: 40");
    });

    it("verifies Overlays register with Priority 100", () => {
      const lightboxPath = path.resolve(__dirname, "../components/chat/media/whatsapp-media-lightbox.tsx");
      const lightboxContent = fs.readFileSync(lightboxPath, "utf-8");
      expect(lightboxContent).toContain('id: "whatsapp-media-lightbox"');
      expect(lightboxContent).toContain("priority: 100");

      const photoSheetPath = path.resolve(__dirname, "../components/settings/profile-photo-sheet.tsx");
      const photoSheetContent = fs.readFileSync(photoSheetPath, "utf-8");
      expect(photoSheetContent).toContain('id: "profile-photo-sheet"');
      expect(photoSheetContent).toContain("priority: 100");
    });
  });
});
