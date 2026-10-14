export {
  NativeCamera,
  NativeCameraWebFallback as NativeCameraWeb,
  captureMedia,
  captureWithNativeCamera,
  nativeResultToFile,
} from "@/features/camera/CameraCapture.shared";

export type {
  CameraMode,
  CameraCaptureResult,
  NativeCameraResult,
  CameraPermissions,
  CameraChunkOptions,
  CameraChunkResult,
  NativeCameraPlugin,
} from "@/features/camera/CameraCapture.types";

export { isAndroidApk, isAndroidNative } from "@/lib/platform/Platform.utils";
