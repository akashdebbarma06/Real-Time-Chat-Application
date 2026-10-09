import { describe, expect, it } from "vitest";
import { validateUploadFile, MAX_FILE_SIZE } from "@/lib/utils";

function validateMessageText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { valid: false, error: "Message cannot be empty" };
  }
  if (trimmed.length > 2000) {
    return { valid: false, error: "Message content exceeds 2,000 characters limit" };
  }
  return { valid: true };
}

describe("Input & File Validation Logic", () => {
  describe("validateUploadFile (Images Only & Security)", () => {
    it("accepts valid image files within 6MB size limit", () => {
      const validImage = { name: "avatar.png", size: 2 * 1024 * 1024, type: "image/png" };
      expect(validateUploadFile(validImage)).toEqual({ valid: true });
    });

    it("rejects non-image files per security policy", () => {
      const pdfFile = { name: "document.pdf", size: 1024 * 1024, type: "application/pdf" };
      const res = validateUploadFile(pdfFile);
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Only image files are permitted");
    });

    it("rejects files larger than 6MB", () => {
      const largeImage = { name: "photo.jpg", size: 10 * 1024 * 1024, type: "image/jpeg" };
      const res = validateUploadFile(largeImage);
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Files must be 6 MB or smaller");
    });

    it("rejects executable or script files for security", () => {
      const exeFile = { name: "malware.exe", size: 1024, type: "application/x-msdownload" };
      const shFile = { name: "script.sh", size: 1024, type: "text/x-sh" };

      expect(validateUploadFile(exeFile).valid).toBe(false);
      expect(validateUploadFile(shFile).valid).toBe(false);
    });
  });

  describe("validateMessageText", () => {
    it("accepts normal messages", () => {
      expect(validateMessageText("Hello world!")).toEqual({ valid: true });
    });

    it("rejects empty or whitespace-only messages", () => {
      expect(validateMessageText("   ").valid).toBe(false);
    });

    it("rejects messages exceeding 2,000 characters", () => {
      const longText = "a".repeat(2001);
      expect(validateMessageText(longText).valid).toBe(false);
    });
  });
});

