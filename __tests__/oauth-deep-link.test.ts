import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { GET, validateNextUrl, getTrustedBaseUrl } from "@/app/auth/callback/route";
import { createClient } from "@/lib/supabase/server";

describe("OAuth Deep Link & Mobile Auth Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("A. validateNextUrl security validation", () => {
    const trustedOrigin = "https://chatsphere-tan.vercel.app";

    it("allows valid internal routes and preserves query params and hashes", () => {
      expect(validateNextUrl("/chat", trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("/profile", trustedOrigin)).toBe("/profile");
      expect(validateNextUrl("/settings?theme=dark&tab=chats#privacy", trustedOrigin)).toBe(
        "/settings?theme=dark&tab=chats#privacy"
      );
      expect(validateNextUrl("/chat?conv=550e8400-e29b-41d4-a716-446655440000", trustedOrigin)).toBe(
        "/chat?conv=550e8400-e29b-41d4-a716-446655440000"
      );
    });

    it("falls back to /chat on missing, null, undefined, or empty values", () => {
      expect(validateNextUrl(null, trustedOrigin)).toBe("/chat");
      expect(validateNextUrl(undefined, trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("", trustedOrigin)).toBe("/chat");
    });

    it("rejects protocol-relative URLs (//evil.example)", () => {
      expect(validateNextUrl("//evil.example", trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("//evil.example/login", trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("///evil.example", trustedOrigin)).toBe("/chat");
    });

    it("rejects absolute external URLs", () => {
      expect(validateNextUrl("https://evil.example", trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("http://attacker.com/steal-token", trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("ftp://files.example.com", trustedOrigin)).toBe("/chat");
    });

    it("rejects backslash-based open redirect bypasses", () => {
      expect(validateNextUrl("/\\evil.example", trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("/\\evil.example/path", trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("\\evil.example", trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("/chat\\evil.example", trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("/settings\\@evil.example", trustedOrigin)).toBe("/chat");
    });

    it("rejects encoded bypass attempts (%2f, %5c, %25)", () => {
      expect(validateNextUrl("/%2f/evil.example", trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("/%5cevil.example", trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("%5c%5cevil.example", trustedOrigin)).toBe("/chat");
    });

    it("rejects unexpected URL schemes (javascript:, data:, vbscript:)", () => {
      expect(validateNextUrl("javascript:alert(1)", trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("data:text/html,<script>alert(1)</script>", trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("vbscript:MsgBox(1)", trustedOrigin)).toBe("/chat");
    });

    it("rejects control characters and newlines", () => {
      expect(validateNextUrl("/chat\r\nSet-Cookie:bad=true", trustedOrigin)).toBe("/chat");
      expect(validateNextUrl("/chat\x00/evil", trustedOrigin)).toBe("/chat");
    });
  });

  describe("B. getTrustedBaseUrl origin validation", () => {
    it("uses NEXT_PUBLIC_SITE_URL when configured", () => {
      const origEnv = process.env.NEXT_PUBLIC_SITE_URL;
      process.env.NEXT_PUBLIC_SITE_URL = "https://custom-chat.example.com";
      const req = new Request("http://localhost:3000/auth/callback");
      expect(getTrustedBaseUrl(req)).toBe("https://custom-chat.example.com");
      process.env.NEXT_PUBLIC_SITE_URL = origEnv;
    });

    it("rejects untrusted x-forwarded-host headers", () => {
      const origEnv = process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.NEXT_PUBLIC_SITE_URL;

      const req = new Request("https://chatsphere-tan.vercel.app/auth/callback", {
        headers: {
          "x-forwarded-host": "attacker-controlled.com",
          "x-forwarded-proto": "https",
        },
      });
      // Should not adopt attacker-controlled.com
      const trusted = getTrustedBaseUrl(req);
      expect(trusted).not.toContain("attacker-controlled.com");

      process.env.NEXT_PUBLIC_SITE_URL = origEnv;
    });
  });

  describe("C. GET route integration & mobile flow", () => {
    it("redirects standard web OAuth callbacks directly to /chat", async () => {
      const mockExchange = vi.fn().mockResolvedValue({
        data: {
          session: { access_token: "mock-access-token", refresh_token: "mock-refresh-token" },
          user: { id: "user-123" },
        },
        error: null,
      });

      vi.mocked(createClient).mockResolvedValue({
        auth: { exchangeCodeForSession: mockExchange },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const request = new Request("https://chatsphere-tan.vercel.app/auth/callback?code=valid-code", {
        headers: { host: "chatsphere-tan.vercel.app" },
      });
      const response = await GET(request);

      expect(mockExchange).toHaveBeenCalledWith("valid-code");
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("https://chatsphere-tan.vercel.app/chat");
    });

    it("redirects to valid same-origin next param on web callback", async () => {
      const mockExchange = vi.fn().mockResolvedValue({
        data: { session: { access_token: "token", refresh_token: "refresh" }, user: { id: "1" } },
        error: null,
      });
      vi.mocked(createClient).mockResolvedValue({
        auth: { exchangeCodeForSession: mockExchange },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const request = new Request("https://chatsphere-tan.vercel.app/auth/callback?code=valid-code&next=/profile", {
        headers: { host: "chatsphere-tan.vercel.app" },
      });
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("https://chatsphere-tan.vercel.app/profile");
    });

    it("safely sanitizes open redirect attempt in next param back to /chat", async () => {
      const mockExchange = vi.fn().mockResolvedValue({
        data: { session: { access_token: "token", refresh_token: "refresh" }, user: { id: "1" } },
        error: null,
      });
      vi.mocked(createClient).mockResolvedValue({
        auth: { exchangeCodeForSession: mockExchange },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const request = new Request(
        "https://chatsphere-tan.vercel.app/auth/callback?code=valid-code&next=//evil.example/steal",
        {
          headers: { host: "chatsphere-tan.vercel.app" },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("https://chatsphere-tan.vercel.app/chat");
    });

    it("returns the HTML mobile app bridge with deep links when source=app is specified", async () => {
      const mockExchange = vi.fn();
      vi.mocked(createClient).mockResolvedValue({
        auth: { exchangeCodeForSession: mockExchange },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const request = new Request(
        "https://chatsphere-tan.vercel.app/auth/callback?code=valid-code&source=app"
      );
      const response = await GET(request);

      // Ensure server DOES NOT attempt code exchange on server (preserving PKCE verifier for client)
      expect(mockExchange).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");

      const html = await response.text();
      expect(html).toContain("aetherchat://auth-callback?code=valid-code");
      expect(html).toContain("intent://auth-callback?code=valid-code#Intent;scheme=aetherchat;package=com.aetherchat.app;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end");
      expect(html).toContain("Open Aether Chat App");
    });

    it("handles missing code gracefully for mobile app source", async () => {
      const request = new Request("https://chatsphere-tan.vercel.app/auth/callback?source=app");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("Sign-in Failed");
      expect(html).toContain("Authentication code missing");
      expect(html).toContain("aetherchat://auth-callback?error=");
    });

    it("handles web OAuth exchange error by redirecting to login with error parameter", async () => {
      const mockExchange = vi.fn().mockResolvedValue({
        data: null,
        error: new Error("Invalid or expired OAuth grant"),
      });

      vi.mocked(createClient).mockResolvedValue({
        auth: { exchangeCodeForSession: mockExchange },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const request = new Request(
        "https://chatsphere-tan.vercel.app/auth/callback?code=expired-code",
        { headers: { host: "chatsphere-tan.vercel.app" } }
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("https://chatsphere-tan.vercel.app/login?error=callback");
    });
  });
});
