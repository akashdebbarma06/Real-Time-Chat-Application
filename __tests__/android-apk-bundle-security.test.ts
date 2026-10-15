import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Production APK Security & Bundled Web Assets Specification", () => {
  it("verifies capacitor.config.ts does not hardcode remote production URL or enable cleartext", () => {
    const configPath = path.resolve(process.cwd(), "capacitor.config.ts");
    expect(fs.existsSync(configPath)).toBe(true);

    const content = fs.readFileSync(configPath, "utf-8");
    // Ensure the hardcoded remote Vercel deployment URL is removed from production config
    expect(content).not.toMatch(/url:\s*['"]https:\/\/chatsphere-tan\.vercel\.app['"]/);
    // Ensure devServerUrl environment check exists
    expect(content).toContain("CAPACITOR_DEV_SERVER_URL");
    // Ensure androidScheme is set to https for secure local origin
    expect(content).toContain("androidScheme: 'https'");
  });

  it("verifies android/app/src/main/assets/capacitor.config.json has no remote URL and cleartext is false", () => {
    const jsonPath = path.resolve(
      process.cwd(),
      "android/app/src/main/assets/capacitor.config.json"
    );
    if (fs.existsSync(jsonPath)) {
      const json = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      expect(json.server).toBeDefined();
      expect(json.server.url).toBeUndefined();
      expect(json.server.cleartext).toBe(false);
      expect(json.server.androidScheme).toBe("https");
      expect(json.webDir).toBe("out");
    } else {
      // In clean CI test runners prior to `cap sync`, verify the source of truth capacitor.config.ts
      const tsPath = path.resolve(process.cwd(), "capacitor.config.ts");
      expect(fs.existsSync(tsPath)).toBe(true);
      const content = fs.readFileSync(tsPath, "utf-8");
      expect(content).not.toMatch(/url:\s*['"]https:\/\/chatsphere-tan\.vercel\.app['"]/);
      expect(content).toContain("androidScheme: 'https'");
      expect(content).toContain("webDir: 'out'");
      expect(content).toContain("cleartext: isDev && devServerUrl ? devServerUrl.startsWith('http://') : false");
    }
  });

  it("verifies AndroidManifest.xml disables allowBackup and usesCleartextTraffic", () => {
    const manifestPath = path.resolve(
      process.cwd(),
      "android/app/src/main/AndroidManifest.xml"
    );
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = fs.readFileSync(manifestPath, "utf-8");
    expect(manifest).toContain('android:allowBackup="false"');
    expect(manifest).toContain('android:usesCleartextTraffic="false"');
    expect(manifest).toContain('android:networkSecurityConfig="@xml/network_security_config"');
    expect(manifest).not.toContain('android:allowBackup="true"');
    expect(manifest).not.toContain('android:usesCleartextTraffic="true"');
  });

  it("verifies network_security_config.xml exists and prohibits cleartext traffic", () => {
    const netSecPath = path.resolve(
      process.cwd(),
      "android/app/src/main/res/xml/network_security_config.xml"
    );
    expect(fs.existsSync(netSecPath)).toBe(true);

    const xml = fs.readFileSync(netSecPath, "utf-8");
    expect(xml).toContain('cleartextTrafficPermitted="false"');
  });

  it("verifies out/index.html is a self-contained local web shell with AetherChat branding", () => {
    const outHtmlPath = path.resolve(process.cwd(), "out/index.html");
    expect(fs.existsSync(outHtmlPath)).toBe(true);

    const html = fs.readFileSync(outHtmlPath, "utf-8");
    expect(html).toContain("<title>AetherChat</title>");
    expect(html).toContain('name="theme-color" content="#09090b"');
    expect(html).not.toContain("ChatSphere");
    expect(html).not.toContain("chatsphere-tan.vercel.app");
  });
});
