import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  PERMISSION_CONFIGS,
  getStoredPermissionStates,
  savePermissionState,
  queryPermissionStatus,
  requestDevicePermission,
  runSequentialPermissionWizard,
  hasPromptedInitialPermissions,
  markInitialPermissionsPrompted,
  resetInitialPermissionsPrompt,
  isBannerSnoozed,
  snoozeBanner,
} from "../lib/permissions/device-permissions";
import fs from "fs";
import path from "path";

describe("Device & Browser Permissions System", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe("Permission Configurations & Specs", () => {
    it("contains configurations for all 8 device permissions", () => {
      const ids = PERMISSION_CONFIGS.map((c) => c.id);
      expect(ids).toContain("notifications");
      expect(ids).toContain("camera");
      expect(ids).toContain("microphone");
      expect(ids).toContain("location");
      expect(ids).toContain("nearby");
      expect(ids).toContain("contacts");
      expect(ids).toContain("storage");
      expect(ids).toContain("phone");
      expect(PERMISSION_CONFIGS.length).toBe(8);
    });

    it("verifies each permission has a human-friendly name, category, and rationale", () => {
      for (const config of PERMISSION_CONFIGS) {
        expect(config.name.length).toBeGreaterThan(0);
        expect(config.description.length).toBeGreaterThan(10);
        expect(config.rationale.length).toBeGreaterThan(10);
        expect(["essential", "media", "hardware", "communication"]).toContain(config.category);
      }
    });
  });

  describe("State & LocalStorage Persistence", () => {
    it("reads default states when localStorage is empty", () => {
      const states = getStoredPermissionStates();
      expect(states.notifications).toBe("prompt");
      expect(states.camera).toBe("prompt");
      expect(states.microphone).toBe("prompt");
    });

    it("persists individual permission updates to localStorage", () => {
      savePermissionState("camera", "granted");
      const updated = getStoredPermissionStates();
      expect(updated.camera).toBe("granted");
      expect(updated.notifications).toBe("prompt");

      savePermissionState("notifications", "denied");
      const updated2 = getStoredPermissionStates();
      expect(updated2.notifications).toBe("denied");
    });

    it("tracks initial setup prompt dismissal and banner snooze", () => {
      expect(hasPromptedInitialPermissions()).toBe(false);
      markInitialPermissionsPrompted();
      expect(hasPromptedInitialPermissions()).toBe(true);

      resetInitialPermissionsPrompt();
      expect(hasPromptedInitialPermissions()).toBe(false);

      expect(isBannerSnoozed()).toBe(false);
      snoozeBanner();
      expect(isBannerSnoozed()).toBe(true);
    });
  });

  describe("Permission Request & Native APIs Fallbacks", () => {
    it("handles notification permission request gracefully", async () => {
      const res = await requestDevicePermission("notifications");
      // In node/vitest, Notification may not be in window, expects unsupported or prompt
      expect(["unsupported", "prompt", "granted", "denied"]).toContain(res.status);
    });

    it("handles storage permission and file input fallback", async () => {
      const res = await requestDevicePermission("storage");
      expect(res.status).toBe("granted");
    });

    it("handles phone telephony dialer intent fallback", async () => {
      const res = await requestDevicePermission("phone");
      expect(res.status).toBe("granted");
    });

    it("runs sequential permission wizard and triggers step progress", async () => {
      const stepsLogged: string[] = [];
      const results = await runSequentialPermissionWizard((step) => {
        stepsLogged.push(step);
      });

      expect(stepsLogged.length).toBeGreaterThan(0);
      expect(results).toBeDefined();
      expect(hasPromptedInitialPermissions()).toBe(true);
    });
  });

  describe("Component Source Verification", () => {
    it("verifies PermissionModal component includes explanation and sequential wizard", () => {
      const modalPath = path.resolve(__dirname, "../components/permissions/permission-modal.tsx");
      expect(fs.existsSync(modalPath)).toBe(true);
      const modalContent = fs.readFileSync(modalPath, "utf-8");

      expect(modalContent).toContain("runSequentialPermissionWizard");
      expect(modalContent).toContain("Notifications");
      expect(modalContent).toContain("Microphone");
      expect(modalContent).toContain("Camera");
      expect(modalContent).toContain("Location");
      expect(modalContent).toContain("Nearby Devices");
      expect(modalContent).toContain("Allow Permissions");
      expect(modalContent).toContain("Maybe Later");
    });

    it("verifies PermissionBanner component provides non-intrusive alerts and quick enable", () => {
      const bannerPath = path.resolve(__dirname, "../components/permissions/permission-banner.tsx");
      expect(fs.existsSync(bannerPath)).toBe(true);
      const bannerContent = fs.readFileSync(bannerPath, "utf-8");

      expect(bannerContent).toContain("checkEssentialPermissions");
      expect(bannerContent).toContain("handleQuickEnable");
      expect(bannerContent).toContain("handleDismiss");
      expect(bannerContent).toContain("snoozeBanner");
    });

    it("verifies PermissionsSettings sub-panel is integrated into Settings", () => {
      const settingsPath = path.resolve(__dirname, "../components/settings/permissions-settings.tsx");
      expect(fs.existsSync(settingsPath)).toBe(true);
      const settingsContent = fs.readFileSync(settingsPath, "utf-8");

      expect(settingsContent).toContain("Device Permissions");
      expect(settingsContent).toContain("PERMISSION_CONFIGS");
      expect(settingsContent).toContain("Reset");
      expect(settingsContent).toContain("Request All Permissions");

      const settingsViewPath = path.resolve(__dirname, "../components/chat/settings-view.tsx");
      const settingsViewContent = fs.readFileSync(settingsViewPath, "utf-8");
      expect(settingsViewContent).toContain('id: "permissions"');
      expect(settingsViewContent).toContain("Device Permissions");
      expect(settingsViewContent).toContain("PermissionsSettings");
    });
  });
});
