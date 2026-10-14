import { isAndroidApk } from "@/lib/platform/Platform.utils";
import { captureWithAndroidCamera, apkResultToFile, NativeCamera, NativeCameraWebFallback } from "./CameraCapture.apk";
import { captureWithWebCamera } from "./CameraCapture.web";
import type { CameraMode } from "./CameraCapture.types";

/**
 * Universal platform-aware camera capture adapter.
 * Uses Capacitor NativeCamera on Android APK and browser file capture on desktop web.
 */
export async function captureMedia(mode: CameraMode = "photo"): Promise<File | null> {
  if (isAndroidApk()) {
    return captureWithAndroidCamera(mode);
  }
  return captureWithWebCamera(mode);
}

// Backward-compatible alias
export const captureWithNativeCamera = captureWithAndroidCamera;
export const nativeResultToFile = apkResultToFile;
export { NativeCamera, NativeCameraWebFallback };
export * from "./CameraCapture.types";
