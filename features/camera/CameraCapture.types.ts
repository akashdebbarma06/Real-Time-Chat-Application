export type CameraMode = "photo" | "video" | "video-note";

export interface CameraCaptureResult {
  cancelled: boolean;
  path?: string;
  name?: string;
  mimeType?: string;
  size?: number;
  mode?: CameraMode;
  base64?: string;
  error?: string;
  message?: string;
}

export interface CameraPermissions {
  camera: "granted" | "denied";
  microphone: "granted" | "denied";
}

export interface CameraChunkOptions {
  path: string;
  offset: number;
  chunkSize?: number;
}

export interface CameraChunkResult {
  base64: string;
  bytesRead: number;
  done: boolean;
}

export interface NativeCameraPlugin {
  open(options?: { mode?: CameraMode }): Promise<CameraCaptureResult>;
  checkCameraPermissions(): Promise<CameraPermissions>;
  openSettings(): Promise<void>;
  getFileBase64(options: { path: string }): Promise<{ base64: string }>;
  readFileChunk(options: CameraChunkOptions): Promise<CameraChunkResult>;
}

// Backward-compatible type aliases
export type NativeCameraResult = CameraCaptureResult;
