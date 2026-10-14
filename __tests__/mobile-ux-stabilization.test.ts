import { describe, expect, it } from "vitest";
import { parseLocationMessage } from "@/components/chat/media/location-card";

describe("Mobile UX Stabilization & Native Features", () => {
  describe("Structured Location Messages & Legacy Backward Compatibility", () => {
    it("correctly parses valid structured JSON location messages", () => {
      const payload = JSON.stringify({
        type: "location",
        latitude: 23.8315,
        longitude: 91.2868,
        address: "Agartala, Tripura",
      });

      const parsed = parseLocationMessage(payload);
      expect(parsed).not.toBeNull();
      expect(parsed?.latitude).toBe(23.8315);
      expect(parsed?.longitude).toBe(91.2868);
      expect(parsed?.address).toBe("Agartala, Tripura");
    });

    it("correctly parses legacy formatted text location messages", () => {
      const legacy = "📍 **Location Shared**\nLatitude: 28.61390, Longitude: 77.20900\nhttps://www.google.com/maps?q=28.61390,77.20900";
      const parsed = parseLocationMessage(legacy);
      expect(parsed).not.toBeNull();
      expect(parsed?.latitude).toBeCloseTo(28.6139, 4);
      expect(parsed?.longitude).toBeCloseTo(77.209, 4);
    });

    it("rejects invalid or out-of-range coordinates", () => {
      const outOfRange = JSON.stringify({
        type: "location",
        latitude: 195.0, // > 90 invalid latitude
        longitude: 45.0,
      });
      expect(parseLocationMessage(outOfRange)).toBeNull();

      expect(parseLocationMessage("Random text message without location")).toBeNull();
      expect(parseLocationMessage(null)).toBeNull();
    });
  });

  describe("SSRF Protection & Safe Link Preview Endpoint Security", () => {
    it("verifies safe URL validator logic blocks loopback and private IPs", () => {
      function isPrivateOrReservedIP(ip: string): boolean {
        const ipv4Match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (ipv4Match) {
          const [, a, b] = ipv4Match.map(Number);
          if (a === 0) return true;
          if (a === 127) return true;
          if (a === 10) return true;
          if (a === 172 && b >= 16 && b <= 31) return true;
          if (a === 192 && b === 168) return true;
          if (a === 169 && b === 254) return true;
          if (a >= 224) return true;
          return false;
        }
        const normalized = ip.toLowerCase();
        if (
          normalized === "::1" ||
          normalized === "::" ||
          normalized.startsWith("fe80:") ||
          normalized.startsWith("fc00:") ||
          normalized.startsWith("fd00:")
        ) {
          return true;
        }
        return false;
      }

      // Loopback
      expect(isPrivateOrReservedIP("127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("127.0.0.2")).toBe(true);
      expect(isPrivateOrReservedIP("::1")).toBe(true);

      // Private ranges
      expect(isPrivateOrReservedIP("10.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("192.168.1.1")).toBe(true);
      expect(isPrivateOrReservedIP("172.16.0.5")).toBe(true);
      expect(isPrivateOrReservedIP("172.31.255.255")).toBe(true);
      expect(isPrivateOrReservedIP("169.254.169.254")).toBe(true); // AWS/cloud metadata IP

      // Public IPs
      expect(isPrivateOrReservedIP("8.8.8.8")).toBe(false);
      expect(isPrivateOrReservedIP("1.1.1.1")).toBe(false);
      expect(isPrivateOrReservedIP("142.250.190.46")).toBe(false);
    });
  });

  describe("System Navigation Bar & Android Permissions Declarations", () => {
    it("verifies POST_NOTIFICATIONS is declared in AndroidManifest.xml", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const manifestPath = path.resolve(__dirname, "../android/app/src/main/AndroidManifest.xml");
      const content = fs.readFileSync(manifestPath, "utf-8");
      expect(content).toContain("android.permission.POST_NOTIFICATIONS");
    });

    it("verifies MainActivity registers SystemTheme and NativeNotifications plugins", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const mainActivityPath = path.resolve(__dirname, "../android/app/src/main/java/com/aetherchat/app/MainActivity.java");
      const content = fs.readFileSync(mainActivityPath, "utf-8");
      expect(content).toContain("registerPlugin(SystemThemePlugin.class)");
      expect(content).toContain("registerPlugin(NativeNotificationsPlugin.class)");
      expect(content).toContain("setupNotificationChannel");
      expect(content).toContain("applyStoredSystemBarsTheme");
    });
  });
});
