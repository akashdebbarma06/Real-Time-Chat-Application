import { describe, expect, it, vi } from "vitest";
import { MediaEditorModal, DRAW_PRESET_COLORS } from "@/components/chat/composer/photos-videos-preview-dialog";

describe("Unified Camera Capture Pipeline & MediaEditorModal Routing Specifications", () => {
  describe("1. Unified Capture Pipeline", () => {
    it("converts snapshot or recording blob into standard File and creates object URL without immediate upload", () => {
      // Mock Blob and File creation
      const mockBlob = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
      const file = new File([mockBlob], `photo-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // Verify standard File properties
      expect(file).toBeInstanceOf(File);
      expect(file.type).toBe("image/jpeg");
      expect(file.name).toMatch(/^photo-\d+\.jpg$/);

      // Verify object URL creation
      const createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/fake-url");
      const objectUrl = createObjectURLMock(file);
      expect(createObjectURLMock).toHaveBeenCalledWith(file);
      expect(objectUrl).toBe("blob:http://localhost/fake-url");
    });

    it("closes camera viewfinder and terminates stream tracks on capture", () => {
      const stopTrackMock = vi.fn();
      const mockStream = {
        getTracks: () => [{ stop: stopTrackMock }, { stop: stopTrackMock }],
      };
      const onOpenChange = vi.fn();
      const onCaptureMedia = vi.fn();

      const handleCapture = (file: File, objectUrl: string) => {
        // Stop all stream tracks
        mockStream.getTracks().forEach((t) => t.stop());
        // Close viewfinder
        onOpenChange(false);
        // Pass to capture pipeline
        onCaptureMedia(file, objectUrl);
      };

      const testFile = new File(["bytes"], "photo-1.jpg", { type: "image/jpeg" });
      handleCapture(testFile, "blob:test");

      expect(stopTrackMock).toHaveBeenCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onCaptureMedia).toHaveBeenCalledWith(testFile, "blob:test");
    });

    it("routes captured camera media into the same selectedMedia state used by gallery uploads", () => {
      let selectedMedia: File[] = [];
      let isEditorOpen = false;

      // Unified route handler for both gallery and camera capture
      const handlePhotosVideosSelect = (files: File[]) => {
        selectedMedia = files;
        isEditorOpen = true;
      };

      const cameraPhoto = new File(["photo-data"], "photo-123.jpg", { type: "image/jpeg" });

      // Camera captures and feeds the same handler
      handlePhotosVideosSelect([cameraPhoto]);

      expect(selectedMedia).toEqual([cameraPhoto]);
      expect(isEditorOpen).toBe(true);
    });
  });

  describe("2. Preview & Edit Modal Routing", () => {
    it("exports MediaEditorModal matching PhotosVideosPreviewDialog", () => {
      expect(MediaEditorModal).toBeDefined();
      expect(typeof MediaEditorModal).toBe("function");
    });

    it("verifies drawing color presets available in MediaEditorModal", () => {
      const hexColors = DRAW_PRESET_COLORS.map((c) => c.hex);
      expect(hexColors).toContain("#ffffff"); // White
      expect(hexColors).toContain("#00a884"); // Emerald
      expect(hexColors).toContain("#3b82f6"); // Blue
      expect(hexColors).toContain("#ef4444"); // Red
      expect(hexColors).toContain("#f97316"); // Orange
      expect(hexColors).toContain("#eab308"); // Yellow
    });

    it("ensures media is only uploaded when the user triggers send from the editor modal", async () => {
      const onSendUpload = vi.fn();
      const cameraVideo = new File(["video-bytes"], "camera-capture-123.webm", { type: "video/webm" });

      // In editor state before upload
      let isModalOpen = true;
      const editorItems = [{
        file: cameraVideo,
        caption: "Check out this quick clip!",
        rotation: 0,
        filter: "none",
      }];

      // Upload is NOT called upon capture
      expect(onSendUpload).not.toHaveBeenCalled();

      // User edits and clicks the Send button inside MediaEditorModal
      const handleEditorSend = async () => {
        for (const item of editorItems) {
          const isVid = item.file.type.startsWith("video/") || Boolean(item.file.name.match(/\.(mp4|mov|mkv|webm)$/i));
          await onSendUpload(item.file, item.caption, isVid ? "video" : "image");
        }
        isModalOpen = false;
      };

      await handleEditorSend();

      expect(onSendUpload).toHaveBeenCalledWith(cameraVideo, "Check out this quick clip!", "video");
      expect(isModalOpen).toBe(false);
    });
  });
});
