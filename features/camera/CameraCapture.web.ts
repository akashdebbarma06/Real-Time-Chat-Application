import type { CameraMode } from "./CameraCapture.types";

/**
 * Web browser implementation for camera capture.
 * Triggers standard browser media input or file dialog.
 */
export async function captureWithWebCamera(
  mode: CameraMode = "photo"
): Promise<File | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";

    if (mode === "photo") {
      input.accept = "image/*";
      input.capture = "environment";
    } else {
      input.accept = "video/*";
      input.capture = "environment";
    }

    input.onchange = () => {
      const file = input.files?.[0] || null;
      resolve(file);
    };

    input.oncancel = () => {
      resolve(null);
    };

    // Trigger file chooser
    input.click();
  });
}
