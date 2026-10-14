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
    private void cameraPermCallback(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            String mode = call.getString("mode", "photo");
            launchCamera(call, mode);
        } else {
            JSObject ret = new JSObject();
            ret.put("cancelled", true);
            ret.put("error", "permission_denied");
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

    @PluginMethod
    public void getFileBase64(PluginCall call) {
        String path = call.getString("path");
        if (path == null) {
            call.reject("Path is required");
            return;
        }
        try {
            File file = new File(path);
            if (!file.exists()) {
                call.reject("File does not exist: " + path);
                return;
            }
            byte[] bytes = new byte[(int) file.length()];
            try (FileInputStream fis = new FileInputStream(file)) {
                fis.read(bytes);
            }
            String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
            JSObject ret = new JSObject();
            ret.put("base64", base64);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to read file: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void readFileChunk(PluginCall call) {
        String path = call.getString("path");
        int offset = call.getInt("offset", 0);
        int chunkSize = call.getInt("chunkSize", 512 * 1024);

        if (path == null) {
            call.reject("Path is required");
            return;
        }

        try {
            File file = new File(path);
            if (!file.exists()) {
                call.reject("File does not exist");
                return;
            }
            long totalSize = file.length();
            if (offset >= totalSize) {
                JSObject ret = new JSObject();
                ret.put("base64", "");
                ret.put("bytesRead", 0);
                ret.put("done", true);
                call.resolve(ret);
                return;
            }

            int toRead = (int) Math.min(chunkSize, totalSize - offset);
            byte[] buffer = new byte[toRead];

            try (FileInputStream fis = new FileInputStream(file)) {
                long skipped = fis.skip(offset);
                int read = fis.read(buffer, 0, toRead);
                String base64 = Base64.encodeToString(buffer, 0, read > 0 ? read : 0, Base64.NO_WRAP);
                JSObject ret = new JSObject();
                ret.put("base64", base64);
                ret.put("bytesRead", read);
                ret.put("done", (offset + read) >= totalSize);
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
