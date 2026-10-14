package com.aetherchat.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.Settings;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Locale;

@CapacitorPlugin(
    name = "NativeCamera",
    permissions = {
        @Permission(
            alias = "camera",
            strings = { Manifest.permission.CAMERA }
        ),
        @Permission(
            alias = "microphone",
            strings = { Manifest.permission.RECORD_AUDIO }
        )
    }
)
public class NativeCameraPlugin extends Plugin {

    @PluginMethod
    public void open(PluginCall call) {
        String mode = call.getString("mode", "photo");

        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissionForAlias("camera", call, "cameraPermCallback");
            return;
        }

        launchCamera(call, mode);
    }

    @PermissionCallback
    public void cameraPermCallback(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            String mode = call.getString("mode", "photo");
            launchCamera(call, mode);
        } else {
            boolean rationale = androidx.core.app.ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.CAMERA);
            JSObject ret = new JSObject();
            ret.put("cancelled", true);
            ret.put("error", "permission_denied");
            ret.put("settingsRequired", !rationale);
            ret.put("message", "Camera permission is required to capture photos and videos.");
            call.resolve(ret);
        }
    }

    private void launchCamera(PluginCall call, String mode) {
        try {
            Intent intent = new Intent(getContext(), CameraActivity.class);
            intent.putExtra("mode", mode);
            startActivityForResult(call, intent, "cameraResultCallback");
        } catch (Exception e) {
            call.reject("Failed to launch camera: " + e.getMessage(), e);
        }
    }

    @ActivityCallback
    private void cameraResultCallback(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            Intent data = result.getData();
            String path = data.getStringExtra("path");
            String name = data.getStringExtra("name");
            String mimeType = data.getStringExtra("mimeType");
            long size = data.getLongExtra("size", 0);
            String mode = data.getStringExtra("mode");

            JSObject ret = new JSObject();
            ret.put("cancelled", false);
            ret.put("path", path);
            ret.put("name", name);
            ret.put("mimeType", mimeType);
            ret.put("size", size);
            ret.put("mode", mode);

            // Read base64 directly from disk in Java process if size <= 15MB
            if (path != null) {
                try {
                    File file = new File(path);
                    if (file.exists() && file.length() <= 15 * 1024 * 1024) {
                        byte[] bytes = new byte[(int) file.length()];
                        try (FileInputStream fis = new FileInputStream(file)) {
                            fis.read(bytes);
                        }
                        String b64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
                        ret.put("base64", b64);
                    }
                } catch (Exception ignored) {}
            }

            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("cancelled", true);
            call.resolve(ret);
        }
    }

    private static final long MAX_FILE_SIZE = 100 * 1024 * 1024L; // 100 MB max media file
    private static final long MAX_WHOLE_FILE_BASE64_SIZE = 15 * 1024 * 1024L; // 15 MB max for whole base64 payload
    private static final int MAX_CHUNK_SIZE = 1024 * 1024; // 1 MB max chunk
    private static final int DEFAULT_CHUNK_SIZE = 512 * 1024; // 512 KB

    private File validateAndResolveMediaFile(String rawPath, PluginCall call) throws IOException {
        if (rawPath == null || rawPath.trim().isEmpty()) {
            call.reject("Path is required");
            return null;
        }

        File file = new File(rawPath.trim());
        String canonicalPath = file.getCanonicalPath();

        // Restrict reads strictly to canonical paths inside app-owned media directories
        File cacheDir = getContext().getCacheDir();
        File externalCacheDir = getContext().getExternalCacheDir();
        File filesDir = getContext().getFilesDir();

        boolean isInsideAllowedDir = false;
        if (cacheDir != null && canonicalPath.startsWith(cacheDir.getCanonicalPath() + File.separator)) {
            isInsideAllowedDir = true;
        } else if (externalCacheDir != null && canonicalPath.startsWith(externalCacheDir.getCanonicalPath() + File.separator)) {
            isInsideAllowedDir = true;
        } else if (filesDir != null && canonicalPath.startsWith(filesDir.getCanonicalPath() + File.separator)) {
            isInsideAllowedDir = true;
        }

        if (!isInsideAllowedDir) {
            call.reject("Access denied: Path is outside authorized app-owned media directories");
            return null;
        }

        if (!file.exists() || !file.isFile()) {
            call.reject("File does not exist or is not a regular file");
            return null;
        }

        // Restrict access to legitimate media file types created by camera / picker features
        String lowerName = file.getName().toLowerCase(Locale.ROOT);
        boolean isMediaExtension = lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")
                || lowerName.endsWith(".png") || lowerName.endsWith(".mp4")
                || lowerName.endsWith(".webm") || lowerName.endsWith(".mov");

        if (!isMediaExtension) {
            call.reject("Access denied: Only media files (.jpg, .jpeg, .png, .mp4, .webm, .mov) can be accessed");
            return null;
        }

        if (file.length() > MAX_FILE_SIZE) {
            call.reject("File size exceeds maximum allowed limit (" + (MAX_FILE_SIZE / (1024 * 1024)) + "MB)");
            return null;
        }

        return file;
    }

    private static void safeSkip(FileInputStream fis, long bytesToSkip) throws IOException {
        long remaining = bytesToSkip;
        while (remaining > 0) {
            long skipped = fis.skip(remaining);
            if (skipped <= 0) {
                if (fis.read() == -1) {
                    break;
                }
                remaining--;
            } else {
                remaining -= skipped;
            }
        }
    }

    @PluginMethod
    public void getFileBase64(PluginCall call) {
        String path = call.getString("path");
        try {
            File file = validateAndResolveMediaFile(path, call);
            if (file == null) return;

            long totalSize = file.length();
            if (totalSize > MAX_WHOLE_FILE_BASE64_SIZE) {
                call.reject("File too large for single base64 payload (" + totalSize + " bytes > "
                        + MAX_WHOLE_FILE_BASE64_SIZE + " bytes). Use readFileChunk to stream in chunks.");
                return;
            }

            byte[] bytes = new byte[(int) totalSize];
            try (FileInputStream fis = new FileInputStream(file)) {
                int totalRead = 0;
                while (totalRead < bytes.length) {
                    int r = fis.read(bytes, totalRead, bytes.length - totalRead);
                    if (r == -1) break;
                    totalRead += r;
                }
            }

            String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
            JSObject ret = new JSObject();
            ret.put("base64", base64);
            ret.put("size", totalSize);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to read file: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void readFileChunk(PluginCall call) {
        String path = call.getString("path");
        int offset = call.getInt("offset", 0);
        int requestedChunkSize = call.getInt("chunkSize", DEFAULT_CHUNK_SIZE);

        if (offset < 0) {
            call.reject("Offset must be non-negative");
            return;
        }

        try {
            File file = validateAndResolveMediaFile(path, call);
            if (file == null) return;

            long totalSize = file.length();
            if (offset >= totalSize) {
                JSObject ret = new JSObject();
                ret.put("base64", "");
                ret.put("bytesRead", 0);
                ret.put("done", true);
                call.resolve(ret);
                return;
            }

            // Enforce safe upper and lower bounds on chunk size (1KB to 1MB)
            int chunkSize = Math.max(1024, Math.min(requestedChunkSize, MAX_CHUNK_SIZE));
            int toRead = (int) Math.min(chunkSize, totalSize - offset);
            byte[] buffer = new byte[toRead];

            try (FileInputStream fis = new FileInputStream(file)) {
                safeSkip(fis, offset);

                int totalRead = 0;
                while (totalRead < toRead) {
                    int r = fis.read(buffer, totalRead, toRead - totalRead);
                    if (r == -1) break;
                    totalRead += r;
                }

                String base64 = Base64.encodeToString(buffer, 0, totalRead > 0 ? totalRead : 0, Base64.NO_WRAP);
                JSObject ret = new JSObject();
                ret.put("base64", base64);
                ret.put("bytesRead", totalRead);
                ret.put("done", (offset + totalRead) >= totalSize);
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("Failed reading chunk: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void checkCameraPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        boolean hasCamera = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
        boolean hasMic = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
        ret.put("camera", hasCamera ? "granted" : "denied");
        ret.put("microphone", hasMic ? "granted" : "denied");
        call.resolve(ret);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package", getContext().getPackageName(), null);
            intent.setData(uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to open app settings: " + e.getMessage(), e);
        }
    }
}
