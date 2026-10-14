import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("NativeCameraPlugin File Security & Bounds Specification", () => {
  const pluginJavaPath = path.resolve(
    process.cwd(),
    "android/app/src/main/java/com/aetherchat/app/NativeCameraPlugin.java"
  );

  it("verifies NativeCameraPlugin.java exists", () => {
    expect(fs.existsSync(pluginJavaPath)).toBe(true);
  });

  it("verifies canonical path restriction to app-owned media directories", () => {
    const code = fs.readFileSync(pluginJavaPath, "utf-8");

    // Canonical path verification
    expect(code).toContain("canonicalPath = file.getCanonicalPath()");
    expect(code).toContain("cacheDir = getContext().getCacheDir()");
    expect(code).toContain("externalCacheDir = getContext().getExternalCacheDir()");
    expect(code).toContain("filesDir = getContext().getFilesDir()");
    expect(code).toContain("Access denied: Path is outside authorized app-owned media directories");
  });

  it("verifies media file extension whitelist is strictly enforced", () => {
    const code = fs.readFileSync(pluginJavaPath, "utf-8");

    expect(code).toContain('.endsWith(".jpg")');
    expect(code).toContain('.endsWith(".jpeg")');
    expect(code).toContain('.endsWith(".png")');
    expect(code).toContain('.endsWith(".mp4")');
    expect(code).toContain('.endsWith(".webm")');
    expect(code).toContain('.endsWith(".mov")');
    expect(code).toContain("Only media files (.jpg, .jpeg, .png, .mp4, .webm, .mov) can be accessed");
  });

  it("verifies safe limits: MAX_FILE_SIZE, MAX_WHOLE_FILE_BASE64_SIZE, and MAX_CHUNK_SIZE", () => {
    const code = fs.readFileSync(pluginJavaPath, "utf-8");

    // Max file size: 100 MB
    expect(code).toContain("MAX_FILE_SIZE = 100 * 1024 * 1024L");
    expect(code).toContain("File size exceeds maximum allowed limit");

    // Max whole file base64: 15 MB
    expect(code).toContain("MAX_WHOLE_FILE_BASE64_SIZE = 15 * 1024 * 1024L");
    expect(code).toContain("File too large for single base64 payload");

    // Max chunk size: 1 MB, default 512 KB
    expect(code).toContain("MAX_CHUNK_SIZE = 1024 * 1024");
    expect(code).toContain("DEFAULT_CHUNK_SIZE = 512 * 1024");
    expect(code).toContain("Math.max(1024, Math.min(requestedChunkSize, MAX_CHUNK_SIZE))");
  });

  it("verifies offset validation and safeSkip implementation for stream reads", () => {
    const code = fs.readFileSync(pluginJavaPath, "utf-8");

    // Offset must be non-negative
    expect(code).toContain('offset < 0');
    expect(code).toContain('Offset must be non-negative');

    // Safe skip loop to handle partial skips on Android input streams
    expect(code).toContain("safeSkip(FileInputStream fis, long bytesToSkip)");
    expect(code).toContain("long skipped = fis.skip(remaining)");
  });
});
