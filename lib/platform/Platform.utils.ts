import { Capacitor } from "@capacitor/core";

/**
 * Returns true if the app is currently running in a standard desktop web browser
 * and NOT inside a native container (Capacitor Android/iOS).
 */
export function isDesktopWeb(): boolean {
  if (typeof window === "undefined") return false;
  return !Capacitor.isNativePlatform() && Capacitor.getPlatform() === "web";
}

/**
 * Returns true if running inside the native Android APK build.
 */
export function isAndroidApk(): boolean {
  if (typeof window === "undefined") return false;
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

/**
 * Alias for isAndroidApk for backward compatibility with existing code.
 */
export const isAndroidNative = isAndroidApk;

/**
 * Returns true if running in any native Capacitor runtime (Android or iOS).
 */
export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  return Capacitor.isNativePlatform();
}

/**
 * Returns the current platform identifier.
 */
export function getPlatformName(): "web" | "android" | "ios" {
  if (typeof window === "undefined") return "web";
  const platform = Capacitor.getPlatform();
  if (platform === "android") return "android";
  if (platform === "ios") return "ios";
  return "web";
}
