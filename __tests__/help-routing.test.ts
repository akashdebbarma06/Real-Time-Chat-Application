import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { handleAuthRedirects } from "@/lib/supabase/middleware";

describe("Help & Feedback Routing and Logic", () => {
  function createRequest(url: string) {
    return new NextRequest(url);
  }

  describe("Authentication Redirect Rules for Help & Public Pages", () => {
    it("redirects unauthenticated users trying to access /help to /login", () => {
      const req = createRequest("http://localhost:3000/help");
      const res = handleAuthRedirects(req, false);

      expect(res).not.toBeNull();
      expect(res?.status).toBe(307);
      expect(res?.headers.get("location")).toContain("/login");
      expect(res?.headers.get("location")).toContain("next=%2Fhelp");
    });

    it("allows unauthenticated users to access public /contact without redirect", () => {
      const req = createRequest("http://localhost:3000/contact");
      const res = handleAuthRedirects(req, false);

      expect(res).toBeNull();
    });

    it("allows unauthenticated users to access public /privacy without redirect", () => {
      const req = createRequest("http://localhost:3000/privacy");
      const res = handleAuthRedirects(req, false);

      expect(res).toBeNull();
    });

    it("redirects authenticated users from /contact to in-app /help/contact", () => {
      const req = createRequest("http://localhost:3000/contact");
      const res = handleAuthRedirects(req, true);

      expect(res).not.toBeNull();
      expect(res?.headers.get("location")).toContain("/help/contact");
    });

    it("redirects authenticated users from /privacy to in-app /help/privacy", () => {
      const req = createRequest("http://localhost:3000/privacy");
      const res = handleAuthRedirects(req, true);

      expect(res).not.toBeNull();
      expect(res?.headers.get("location")).toContain("/help/privacy");
    });

    it("allows authenticated users to view public page if ?public=true is supplied", () => {
      const req = createRequest("http://localhost:3000/contact?public=true");
      const res = handleAuthRedirects(req, true);

      expect(res).toBeNull();
    });
  });

  describe("Ticket Reference Generation", () => {
    function generateTicketRef() {
      return `AETH-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    it("generates a valid 6-digit reference prefixed with AETH-", () => {
      const ref = generateTicketRef();
      expect(ref).toMatch(/^AETH-\d{6}$/);
    });
  });

  describe("In-App Ticket Form Validation", () => {
    function validateTicketForm(subject: string, message: string) {
      if (!subject.trim()) return { valid: false, error: "Subject is required" };
      if (!message.trim() || message.trim().length < 10) {
        return { valid: false, error: "Message must be at least 10 characters" };
      }
      return { valid: true };
    }

    it("rejects empty subject", () => {
      const result = validateTicketForm("", "This is a valid long description");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Subject is required");
    });

    it("rejects short message", () => {
      const result = validateTicketForm("Issue", "short");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least 10 characters");
    });

    it("accepts valid subject and detailed message", () => {
      const result = validateTicketForm("Audio issue", "My audio stream is not playing in the chat room.");
      expect(result.valid).toBe(true);
    });
  });

  describe("Privacy Data Export Payload", () => {
    function buildExportPayload(profile: { id: string; username: string; display_name: string; bio: string }) {
      return {
        application: "Aether Chat",
        exportDate: new Date().toISOString(),
        profile: {
          id: profile.id,
          username: profile.username,
          displayName: profile.display_name,
          bio: profile.bio,
        },
        securityProtocols: {
          databaseProtection: "PostgreSQL Row Level Security (RLS)",
        },
      };
    }

    it("creates sanitized structured JSON export with profile information", () => {
      const profile = { id: "u-1", username: "akash", display_name: "Akash", bio: "Developer" };
      const data = buildExportPayload(profile);
      expect(data.application).toBe("Aether Chat");
      expect(data.profile.username).toBe("akash");
      expect(data.securityProtocols.databaseProtection).toContain("RLS");
    });
  });
});
