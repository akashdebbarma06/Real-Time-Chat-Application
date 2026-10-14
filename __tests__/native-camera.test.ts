import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  isAndroidNative,
  nativeResultToFile,
  captureWithNativeCamera,
  NativeCamera,
  NativeCameraWeb,
} from "@/lib/camera/native-camera";
import { Capacitor } from "@capacitor/core";

describe("Native Camera Bridge & Android APK Media Flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Platform Detection", () => {
    it("returns false on web/desktop browser", () => {
      vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(false);
      vi.spyOn(Capacitor, "getPlatform").mockReturnValue("web");
      expect(isAndroidNative()).toBe(false);
    });

    it("returns true when running inside Android APK", () => {
      vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
      vi.spyOn(Capacitor, "getPlatform").mockReturnValue("android");
      expect(isAndroidNative()).toBe(true);
    });

    it("returns false for non-android native platforms (e.g. ios)", () => {
      vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
      vi.spyOn(Capacitor, "getPlatform").mockReturnValue("ios");
      expect(isAndroidNative()).toBe(false);
    });
  });

  describe("Native Result to Web File Conversion", () => {
    it("returns null if user cancelled the camera", async () => {
      const file = await nativeResultToFile({ cancelled: true });
      expect(file).toBeNull();
    });

    it("returns null if no path is provided", async () => {
      const file = await nativeResultToFile({ cancelled: false });
      expect(file).toBeNull();
    });

    it("converts direct base64 into a valid File object", async () => {
      // "Hello Aether Camera" in base64
      const testBase64 = btoa("Hello Aether Camera");
      const file = await nativeResultToFile({
        cancelled: false,
        path: "/cache/aether_photo_123.jpg",
        name: "aether_photo_123.jpg",
        mimeType: "image/jpeg",
        size: 19,
        mode: "photo",
        base64: testBase64,
      });

      expect(file).not.toBeNull();
      expect(file?.name).toBe("aether_photo_123.jpg");
      expect(file?.type).toBe("image/jpeg");
      expect(file?.size).toBe(19);
    });

    it("supports chunked reading for large media files without base64 in initial payload", async () => {
      const part1 = btoa("ChunkPart1");
      const part2 = btoa("ChunkPart2");

      let callCount = 0;
      vi.spyOn(NativeCameraWeb.prototype, "readFileChunk").mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return { base64: part1, bytesRead: 10, done: false };
        } else {
          return { base64: part2, bytesRead: 10, done: true };
        }
      });

      const file = await nativeResultToFile({
        cancelled: false,
        path: "/cache/aether_video_large.mp4",
        name: "aether_video_large.mp4",
        mimeType: "video/mp4",
        size: 20,
        mode: "video",
      });

      expect(file).not.toBeNull();
      expect(file?.name).toBe("aether_video_large.mp4");
      expect(file?.type).toBe("video/mp4");
      expect(file?.size).toBe(20);
      expect(callCount).toBe(2);
    });
  });

  describe("captureWithNativeCamera", () => {
    it("invokes NativeCamera.open with correct mode and returns File", async () => {
      const testBase64 = btoa("VideoNoteData");
      const openSpy = vi.spyOn(NativeCameraWeb.prototype, "open").mockResolvedValue({
        cancelled: false,
        path: "/cache/aether_videonote.mp4",
        name: "aether_videonote.mp4",
        mimeType: "video/mp4",
        size: 13,
        mode: "video-note",
        base64: testBase64,
      });

      const file = await captureWithNativeCamera("video-note");

      expect(openSpy).toHaveBeenCalledWith({ mode: "video-note" });
      expect(file).not.toBeNull();
      expect(file?.name).toBe("aether_videonote.mp4");
      expect(file?.type).toBe("video/mp4");
    });

    it("handles permission denial gracefully and returns null", async () => {
      vi.spyOn(NativeCameraWeb.prototype, "open").mockResolvedValue({
        cancelled: true,
        error: "permission_denied",
        message: "Camera permission is required",
      });

      const file = await captureWithNativeCamera("photo");
      expect(file).toBeNull();
    });
  });
});
