import { describe, it, expect, beforeEach } from "vitest";
import { generateFaviconSvgUrl } from "@/hooks/use-dynamic-favicon";
import {
  ACCENT_COLORS,
  APP_ICONS,
  applyAppearanceToDOM,
  BUBBLE_STYLES,
  CHAT_BACKGROUNDS,
} from "@/lib/appearance-store";

describe("Dynamic Branding & Appearance Synchronization", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-accent");
    document.documentElement.removeAttribute("data-app-icon");
    document.documentElement.removeAttribute("data-bubble-style");
    document.documentElement.removeAttribute("data-chat-bg");
  });

  it("generates an SVG Data URL with the unified squircle and 3-dot geometry from hex", () => {
    const roseUrl = generateFaviconSvgUrl("#f43f5e");
    expect(roseUrl).toContain("data:image/svg+xml;utf8,");
    const decoded = decodeURIComponent(roseUrl);
    expect(decoded).toContain('<rect width="128" height="128" rx="36" fill="#f43f5e"');
    expect(decoded).toContain('fill="#FFFFFF"');
    expect(decoded).toContain('<circle cx="51" cy="51" r="5" fill="#f43f5e"');
    expect(decoded).toContain('<circle cx="64" cy="51" r="5" fill="#f43f5e"');
    expect(decoded).toContain('<circle cx="77" cy="51" r="5" fill="#f43f5e"');
  });

  it("generates a dynamic gradient SVG Data URL from AppIconChoice stops", () => {
    const sunsetIcon = APP_ICONS.find((i) => i.id === "sunset");
    expect(sunsetIcon).toBeDefined();

    const sunsetUrl = generateFaviconSvgUrl({
      stops: sunsetIcon!.stops,
      dotColor: sunsetIcon!.dotColor,
    });
    const decoded = decodeURIComponent(sunsetUrl);
    expect(decoded).toContain("<linearGradient");
    expect(decoded).toContain('stop-color="#f43f5e"');
    expect(decoded).toContain('fill="url(#favGrad)"');
    expect(decoded).toContain('<circle cx="51" cy="51" r="5" fill="#f43f5e"');
  });

  it("synchronizes dynamic CSS variables (--color-accent, --primary) and attributes on DOM documentElement", () => {
    applyAppearanceToDOM({
      accentColor: "rose",
      bubbleStyle: "pill",
      chatBackground: "dots",
      appIcon: "sunset",
      fontSize: "normal",
    });

    const root = document.documentElement;
    expect(root.getAttribute("data-accent")).toBe("rose");
    expect(root.getAttribute("data-app-icon")).toBe("sunset");
    expect(root.getAttribute("data-bubble-style")).toBe("pill");
    expect(root.getAttribute("data-chat-bg")).toBe("dots");

    expect(root.style.getPropertyValue("--color-accent")).toBe("#f43f5e");
    expect(root.style.getPropertyValue("--color-accent-hover")).toBe("#e11d48");
    expect(root.style.getPropertyValue("--primary")).toBe("#f43f5e");
    expect(root.style.getPropertyValue("--ring")).toBe("#f43f5e");
  });

  it("provides valid configurations and gradient stops for all 5 app icons", () => {
    expect(APP_ICONS.length).toBe(5);
    const iconIds = APP_ICONS.map((i) => i.id);
    expect(iconIds).toEqual(["classic", "neon", "emerald", "sunset", "midnight"]);

    APP_ICONS.forEach((icon) => {
      expect(icon.stops).toHaveLength(3);
      expect(icon.dotColor).toBeDefined();
      expect(icon.primaryHex).toBeDefined();
    });
  });

  it("configures official hex values for Emerald (#00a884), Ocean (#007bfc), Violet (#7c3aed), Rose (#f43f5e)", () => {
    const emerald = ACCENT_COLORS.find((c) => c.id === "emerald");
    const ocean = ACCENT_COLORS.find((c) => c.id === "blue");
    const violet = ACCENT_COLORS.find((c) => c.id === "purple");
    const rose = ACCENT_COLORS.find((c) => c.id === "rose");

    expect(emerald?.hex).toBe("#00a884");
    expect(ocean?.hex).toBe("#007bfc");
    expect(violet?.hex).toBe("#7c3aed");
    expect(rose?.hex).toBe("#f43f5e");
  });

  it("provides valid bubble styles for Default, Classic, and Pill", () => {
    const rounded = BUBBLE_STYLES.find((b) => b.id === "rounded");
    const classic = BUBBLE_STYLES.find((b) => b.id === "classic");
    const pill = BUBBLE_STYLES.find((b) => b.id === "pill");

    expect(rounded).toBeDefined();
    expect(classic).toBeDefined();
    expect(pill).toBeDefined();
  });

  it("provides dots background class for doodle wallpaper", () => {
    const dots = CHAT_BACKGROUNDS.find((b) => b.id === "dots");
    expect(dots?.className).toBe("chat-bg-dots");
  });
});
