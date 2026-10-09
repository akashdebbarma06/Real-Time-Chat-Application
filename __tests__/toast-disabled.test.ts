import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { toast } from "../lib/toast";

describe("Toast Removal & Silent Replacement", () => {
  const appProvidersPath = path.resolve(__dirname, "../components/providers/app-providers.tsx");
  const appProvidersContent = fs.readFileSync(appProvidersPath, "utf-8");

  it("does not render any Toaster component inside AppProviders", () => {
    expect(appProvidersContent).not.toContain("<Toaster");
    expect(appProvidersContent).not.toMatch(/from\s+["']sonner["']/);
  });

  it("provides silent no-op implementations for all toast methods", () => {
    expect(() => toast("test")).not.toThrow();
    expect(() => toast.error("Error occurred")).not.toThrow();
    expect(() => toast.success("Saved successfully")).not.toThrow();
    expect(() => toast.info("Info message")).not.toThrow();
    expect(() => toast.warning("Warning message")).not.toThrow();
    expect(() => toast.message("Message")).not.toThrow();
    expect(() => toast.custom(() => null)).not.toThrow();
    expect(() => toast.dismiss()).not.toThrow();
    expect(() => toast.dismiss("123")).not.toThrow();
  });

  it("handles toast.promise properly by resolving the wrapped promise", async () => {
    const samplePromise = Promise.resolve("done");
    const result = await toast.promise(samplePromise, {
      loading: "Loading...",
      success: "Done!",
      error: "Failed!",
    });
    expect(result).toBe("done");
  });

  it("ensures no components import from sonner", () => {
    const componentsDir = path.resolve(__dirname, "../components");
    function checkDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
          const content = fs.readFileSync(fullPath, "utf-8");
          expect(content).not.toMatch(/from\s+["']sonner["']/);
        }
      }
    }
    checkDir(componentsDir);
  });
});
