import { describe, expect, it } from "vitest";

const MAX_FILE_SIZE = 6 * 1024 * 1024;
const FORBIDDEN_EXTENSIONS = [".exe", ".bat", ".cmd", ".sh", ".msi", ".vbs", ".ps1"];

function validateFile(file: { name: string; size: number }) {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (FORBIDDEN_EXTENSIONS.includes(ext)) {
    return { valid: false, error: "Executable files are not permitted for security" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "Files must be 6 MB or smaller" };
  }
  return { valid: true };
}

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
  describe("validateFile", () => {
    it("accepts valid files within 6MB size limit", () => {
      const validFile = { name: "document.pdf", size: 2 * 1024 * 1024 };
      expect(validateFile(validFile)).toEqual({ valid: true });
    });

    it("rejects files larger than 6MB", () => {
      const largeFile = { name: "video.mp4", size: 10 * 1024 * 1024 };
      const res = validateFile(largeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Files must be 6 MB or smaller");
    });

    it("rejects executable or script files for security", () => {
      const exeFile = { name: "malware.exe", size: 1024 };
      const shFile = { name: "script.sh", size: 1024 };

      expect(validateFile(exeFile).valid).toBe(false);
      expect(validateFile(shFile).valid).toBe(false);
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
