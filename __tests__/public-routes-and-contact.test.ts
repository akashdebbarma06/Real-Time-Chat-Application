import { describe, expect, it, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, resetContactRateLimits, checkContactRateLimit } from "@/app/api/contact/route";
import { metadata as aboutMetadata } from "@/app/(public)/about/page";
import { metadata as contactMetadata } from "@/app/(public)/contact/page";
import { metadata as privacyMetadata } from "@/app/(public)/privacy/page";
import { metadata as termsMetadata } from "@/app/(public)/terms/page";
import { metadata as cookiesMetadata } from "@/app/(public)/cookies/page";
import { metadata as homeMetadata } from "@/app/page";

describe("Public Website, Landing Page & Contact API Suite", () => {
  beforeEach(() => {
    resetContactRateLimits();
  });

  describe("1. Contact Submission API (/api/contact)", () => {
    it("rejects missing or invalid names", async () => {
      const req = new NextRequest("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: "a", // too short
          email: "valid@example.com",
          message: "Valid message content with sufficient length.",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Name must be between 2 and 100 characters");
    });

    it("rejects invalid email formats", async () => {
      const req = new NextRequest("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: "Alex Morgan",
          email: "not-an-email",
          message: "Valid message content with sufficient length.",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("valid email address");
    });

    it("rejects messages shorter than 10 characters", async () => {
      const req = new NextRequest("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: "Alex Morgan",
          email: "alex@example.com",
          message: "short",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("between 10 and 3,000 characters");
    });

    it("detects bot honeypots and handles silently without error", async () => {
      const req = new NextRequest("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: "Spam Bot",
          email: "bot@spammer.com",
          message: "Buy cheap products now online!",
          honeypot: "I am a bot filling every input field",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.ticketId).toBe("AETH-REF-PROCESSED");
    });

    it("successfully creates a ticket for valid submission", async () => {
      const req = new NextRequest("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: "Sarah Connor",
          email: "sarah@cyberdyne.net",
          subject: "Android APK question",
          message: "Does the Android APK build support offline caching on Android 14?",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.ticketId).toMatch(/^AETH-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(data.message).toContain("Your inquiry has been received");
    });

    it("enforces rate limits on repeated submissions from the same IP", async () => {
      const ip = "192.168.1.100";
      // 5 requests allowed
      for (let i = 0; i < 5; i++) {
        expect(checkContactRateLimit(ip)).toBe(true);
      }
      // 6th request rejected
      expect(checkContactRateLimit(ip)).toBe(false);

      // Verify route returns 429
      const req = new NextRequest("http://localhost:3000/api/contact", {
        method: "POST",
        headers: { "x-forwarded-for": ip },
        body: JSON.stringify({
          name: "Spammy User",
          email: "spammy@example.com",
          message: "Repeated inquiry message that hits limit.",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toContain("Too many contact submissions");
    });
  });

  describe("2. Public Pages SEO & Metadata Integrity", () => {
    it("defines page-specific metadata for home, about, contact, privacy, terms, and cookies", () => {
      expect(homeMetadata.title).toContain("Aether Chat");
      expect(aboutMetadata.title).toContain("About Aether Chat");
      expect(contactMetadata.title).toContain("Contact");
      expect(privacyMetadata.title).toContain("Privacy Policy");
      expect(termsMetadata.title).toContain("Terms of Service");
      expect(cookiesMetadata.title).toContain("Cookie");
    });

    it("avoids unverified absolute claims in descriptions", () => {
      const aboutDesc = String(aboutMetadata.description);
      expect(aboutDesc).not.toContain("sub-millisecond");
      expect(aboutDesc).not.toContain("unbreakable");
    });
  });
});
