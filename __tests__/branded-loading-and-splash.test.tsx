import { describe, expect, it } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { BrandedLoadingScreen } from "@/components/ui/branded-loading-screen";

describe("AetherChat Branded Loading Animation & Native Splash Suite", () => {
  it("renders BrandedLoadingScreen with default accessibility semantics and branding", () => {
    render(<BrandedLoadingScreen />);

    const statusElement = screen.getByRole("status");
    expect(statusElement).toBeDefined();
    expect(statusElement.getAttribute("aria-live")).toBe("polite");
    expect(statusElement.getAttribute("aria-label")).toBe("Loading AetherChat");

    expect(screen.getByText("AetherChat")).toBeDefined();
    expect(screen.getByText("Loading AetherChat...")).toBeDefined();
  });

  it("renders custom message and handles showProgress toggle", () => {
    const { rerender } = render(
      <BrandedLoadingScreen message="Connecting to encrypted workspace..." showProgress={true} />
    );

    expect(screen.getByText("Connecting to encrypted workspace...")).toBeDefined();

    // Rerender with custom message and showProgress=false
    rerender(
      <BrandedLoadingScreen message="Restoring session..." showProgress={false} />
    );
    expect(screen.getByText("Restoring session...")).toBeDefined();
  });

  it("includes prefers-reduced-motion classes on animated SVG and aura elements", () => {
    const { container } = render(<BrandedLoadingScreen />);

    // SVG animated ring must have motion-reduce:animate-none
    const animatedSvg = container.querySelector("svg.animate-spin");
    expect(animatedSvg).not.toBeNull();
    expect(animatedSvg?.getAttribute("class")).toContain("motion-reduce:animate-none");

    // Glow aura must have motion-reduce:animate-none
    const glowAura = container.querySelector(".bg-primary\\/20");
    expect(glowAura).not.toBeNull();
    expect(glowAura?.getAttribute("class")).toContain("motion-reduce:animate-none");
  });

  it("supports inline container mode without fixed fullscreen overlay", () => {
    const { container } = render(<BrandedLoadingScreen fullScreen={false} />);
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.className).not.toContain("fixed");
    expect(rootDiv.className).toContain("min-h-[320px]");
  });

  it("verifies capacitor.config.ts contains correct Splash Screen configuration", () => {
    const capConfigPath = path.resolve(process.cwd(), "capacitor.config.ts");
    expect(fs.existsSync(capConfigPath)).toBe(true);

    const configContent = fs.readFileSync(capConfigPath, "utf-8");
    expect(configContent).toContain("SplashScreen:");
    expect(configContent).toContain('launchShowDuration: 2000');
    expect(configContent).toContain('launchAutoHide: true');
    expect(configContent).toContain('launchFadeOutDuration: 300');
    expect(configContent).toContain('backgroundColor: "#09090b"');
    expect(configContent).toContain('androidScaleType: "CENTER_INSIDE"');
  });

  it("verifies Android styles.xml uses Android 12+ SplashScreen theme and #09090b dark palette", () => {
    const stylesPath = path.resolve(
      process.cwd(),
      "android/app/src/main/res/values/styles.xml"
    );
    expect(fs.existsSync(stylesPath)).toBe(true);

    const stylesContent = fs.readFileSync(stylesPath, "utf-8");
    expect(stylesContent).toContain('name="windowSplashScreenBackground">#09090b');
    expect(stylesContent).toContain('name="windowSplashScreenAnimatedIcon">@drawable/splash_icon');
    expect(stylesContent).toContain('name="postSplashScreenTheme">@style/AppTheme.NoActionBar');
  });

  it("verifies splash_icon.png and Android density splash drawables exist", () => {
    const splashIconPath = path.resolve(
      process.cwd(),
      "android/app/src/main/res/drawable/splash_icon.png"
    );
    expect(fs.existsSync(splashIconPath)).toBe(true);

    const resDir = path.resolve(process.cwd(), "android/app/src/main/res");
    const densityDirs = [
      "drawable-port-mdpi",
      "drawable-port-hdpi",
      "drawable-port-xhdpi",
      "drawable-port-xxhdpi",
      "drawable-port-xxxhdpi",
      "drawable-land-mdpi",
      "drawable-land-hdpi",
      "drawable-land-xhdpi",
      "drawable-land-xxhdpi",
      "drawable-land-xxxhdpi",
    ];

    for (const dir of densityDirs) {
      const splashFile = path.join(resDir, dir, "splash.png");
      expect(fs.existsSync(splashFile)).toBe(true);
    }
  });

  it("verifies app/loading.tsx and app/(app)/loading.tsx use BrandedLoadingScreen", () => {
    const rootLoading = path.resolve(process.cwd(), "app/loading.tsx");
    const appLoading = path.resolve(process.cwd(), "app/(app)/loading.tsx");

    expect(fs.existsSync(rootLoading)).toBe(true);
    expect(fs.existsSync(appLoading)).toBe(true);

    const rootContent = fs.readFileSync(rootLoading, "utf-8");
    const appContent = fs.readFileSync(appLoading, "utf-8");

    expect(rootContent).toContain("BrandedLoadingScreen");
    expect(appContent).toContain("BrandedLoadingScreen");
  });
});
