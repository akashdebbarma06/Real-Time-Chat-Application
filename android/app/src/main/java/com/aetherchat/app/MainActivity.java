package com.aetherchat.app;

import android.Manifest;
import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import android.view.Window;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppIconPlugin.class);
        registerPlugin(NativePermissionsPlugin.class);
        registerPlugin(NativeCameraPlugin.class);
        super.onCreate(savedInstanceState);

        // Ensure status bar and navigation bar icons are light (white) for the app's dark theme
        Window window = getWindow();
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
        if (insetsController != null) {
            insetsController.setAppearanceLightStatusBars(false);
            insetsController.setAppearanceLightNavigationBars(false);
        }
    }

    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }

    @Override
    public void onPause() {
        super.onPause();
        try {
            android.webkit.CookieManager.getInstance().flush();
        } catch (Exception ignored) {}
    }

    @CapacitorPlugin(name = "AppIcon")
    public static class AppIconPlugin extends Plugin {
        @PluginMethod
        public void setAppIcon(PluginCall call) {
            String icon = call.getString("name", "emerald");
            try {
                PackageManager pm = getContext().getPackageManager();
                String packageName = getContext().getPackageName();

                String[] aliases = {
                    ".MainActivity",
                    ".MainActivityClassic",
                    ".MainActivityNeon",
                    ".MainActivitySunset",
                    ".MainActivityMidnight"
                };

                String targetAlias = ".MainActivity";
                if ("classic".equalsIgnoreCase(icon)) {
                    targetAlias = ".MainActivityClassic";
                } else if ("neon".equalsIgnoreCase(icon)) {
                    targetAlias = ".MainActivityNeon";
                } else if ("sunset".equalsIgnoreCase(icon)) {
                    targetAlias = ".MainActivitySunset";
                } else if ("midnight".equalsIgnoreCase(icon)) {
                    targetAlias = ".MainActivityMidnight";
                }

                for (String alias : aliases) {
                    ComponentName comp = new ComponentName(packageName, packageName + alias);
                    int state = alias.equals(targetAlias)
                        ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                        : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
                    pm.setComponentEnabledSetting(comp, state, PackageManager.DONT_KILL_APP);
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to set app icon: " + e.getMessage(), e);
            }
        }
    }

    @CapacitorPlugin(
        name = "NativePermissions",
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
    public static class NativePermissionsPlugin extends Plugin {
        private static final String PREFS_NAME = "aether_native_perms_v1";

        @PluginMethod
        public void checkPermissionStatus(PluginCall call) {
            String alias = call.getString("alias", "");
            JSObject ret = new JSObject();
            ret.put("status", computePermissionStatus(alias));
            call.resolve(ret);
        }

        @PluginMethod
        public void requestPermission(PluginCall call) {
            String alias = call.getString("alias", "");
            if (alias == null || alias.isEmpty()) {
                call.reject("Alias is required");
                return;
            }

            if ("camera".equalsIgnoreCase(alias) || "microphone".equalsIgnoreCase(alias)) {
                markRequested(alias);
                requestPermissionForAlias(alias.toLowerCase(), call, "permissionCallback");
                return;
            }

            // Storage, phone, location, contacts use system pickers/intents or are not runtime permissions
            JSObject ret = new JSObject();
            ret.put("status", "granted");
            call.resolve(ret);
        }

        @PermissionCallback
        public void permissionCallback(PluginCall call) {
            String alias = call.getString("alias", "");
            JSObject ret = new JSObject();
            ret.put("status", computePermissionStatus(alias));
            call.resolve(ret);
        }

        @PluginMethod
        public void openAppSettings(PluginCall call) {
            try {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                Uri uri = Uri.fromParts("package", getContext().getPackageName(), null);
                intent.setData(uri);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to open application settings: " + e.getMessage(), e);
            }
        }

        private void markRequested(String alias) {
            try {
                SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                prefs.edit().putBoolean("requested_" + alias.toLowerCase(), true).apply();
            } catch (Exception ignored) {}
        }

        private boolean hasBeenRequested(String alias) {
            try {
                SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                return prefs.getBoolean("requested_" + alias.toLowerCase(), false);
            } catch (Exception ignored) {
                return false;
            }
        }

        private String computePermissionStatus(String alias) {
            if ("camera".equalsIgnoreCase(alias)) {
                return checkSingle(Manifest.permission.CAMERA, "camera");
            }

            if ("microphone".equalsIgnoreCase(alias)) {
                return checkSingle(Manifest.permission.RECORD_AUDIO, "microphone");
            }

            return "granted";
        }

        private String checkSingle(String permString, String alias) {
            int check = ContextCompat.checkSelfPermission(getContext(), permString);
            if (check == PackageManager.PERMISSION_GRANTED) {
                return "granted";
            }
            boolean rationale = ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), permString);
            if (hasBeenRequested(alias) && !rationale) {
                return "settings-required";
            }
            return "prompt";
        }
    }
}
