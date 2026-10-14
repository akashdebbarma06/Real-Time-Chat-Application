import { registerPlugin } from "@capacitor/core";
import { toast } from "@/lib/toast";
import type {
  CameraCaptureResult,
  CameraMode,
  NativeCameraPlugin,
} from "./CameraCapture.types";

export class NativeCameraWebFallback implements NativeCameraPlugin {
  async open(): Promise<CameraCaptureResult> {
    return {
      cancelled: true,
      error: "unimplemented",
      message: "Native camera only supported on Android native",
    };
  }
  async checkCameraPermissions() {
    return { camera: "denied" as const, microphone: "denied" as const };
  }
  async openSettings(): Promise<void> {}
  async getFileBase64(): Promise<{ base64: string }> {
    return { base64: "" };
  }
  async readFileChunk() {
    return { base64: "", bytesRead: 0, done: true };
  }
}

export const NativeCamera = registerPlugin<NativeCameraPlugin>("NativeCamera", {
  web: () => Promise.resolve(new NativeCameraWebFallback()),
});

/**
 * Converts a base64 string to a Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts native Android APK camera result into a standard web File object.
 */
export async function apkResultToFile(
  result: CameraCaptureResult
): Promise<File | null> {
  if (result.cancelled || !result.path) {
    return null;
  }

  const fileName =
    result.name ||
    (result.mimeType?.startsWith("video/") ? "video.mp4" : "photo.jpg");
  const mimeType =
    result.mimeType ||
    (result.name?.endsWith(".mp4") ? "video/mp4" : "image/jpeg");

  try {
    // 1. If base64 was provided directly in result (files <= 15MB)
    if (result.base64 && result.base64.length > 0) {
      const bytes = base64ToUint8Array(result.base64);
      return new File([bytes], fileName, { type: mimeType });
    }

    // 2. Fallback for larger files: read chunks in 1MB buffers
    const chunks: Uint8Array[] = [];
    let offset = 0;
    const chunkSize = 1024 * 1024;
    let done = false;

    while (!done) {
      const chunkRes = await NativeCamera.readFileChunk({
        path: result.path,
        offset,
        chunkSize,
      });

      if (chunkRes.base64 && chunkRes.bytesRead > 0) {
        chunks.push(base64ToUint8Array(chunkRes.base64));
        offset += chunkRes.bytesRead;
      }

      done = chunkRes.done || chunkRes.bytesRead === 0;
    }

    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const combined = new Uint8Array(totalLength);
    let currentOffset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, currentOffset);
      currentOffset += chunk.length;
    }

    return new File([combined], fileName, { type: mimeType });
  } catch (err) {
    console.error("Failed to construct File from native camera result:", err);
    toast.error("Failed to process captured media.");
    return null;
  }
}

/**
 * Android APK specific camera capture using Capacitor NativeCamera bridge.
 */
export async function captureWithAndroidCamera(
  mode: CameraMode = "photo"
): Promise<File | null> {
  try {
    const result = await NativeCamera.open({ mode });

    if (result.error === "permission_denied") {
      toast.error(
        "Camera permission is required to capture photos or videos. Please enable it in Android Settings.",
        {
          duration: 5000,
          action: {
            label: "Settings",
            onClick: () => {
              void NativeCamera.openSettings();
            },
          },
        }
      );
      return null;
    }

    if (result.cancelled) {
      return null;
    }

    return await apkResultToFile(result);
  } catch (err) {
    console.error("Error opening native camera on Android:", err);
    toast.error("Could not open native camera.");
    return null;
  }
}
