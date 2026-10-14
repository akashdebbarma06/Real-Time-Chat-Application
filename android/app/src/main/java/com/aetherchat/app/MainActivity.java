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
        super.onCreate(savedInstanceState);
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
            ),
            @Permission(
                alias = "notifications",
                strings = { Manifest.permission.POST_NOTIFICATIONS }
            ),
            @Permission(
                alias = "location",
                strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION }
            ),
            @Permission(
                alias = "contacts",
                strings = { Manifest.permission.READ_CONTACTS }
            ),
            @Permission(
                alias = "storageModern",
                strings = { Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO }
            ),
            @Permission(
                alias = "storageLegacy",
                strings = { Manifest.permission.READ_EXTERNAL_STORAGE }
            ),
            @Permission(
                alias = "nearbyModern",
                strings = { Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_SCAN }
            ),
            @Permission(
                alias = "nearbyLegacy",
                strings = { Manifest.permission.BLUETOOTH }
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

            if ("phone".equalsIgnoreCase(alias)) {
                JSObject ret = new JSObject();
                ret.put("status", "granted");
                call.resolve(ret);
                return;
            }

            // Notifications on older Android
            if ("notifications".equalsIgnoreCase(alias) && Build.VERSION.SDK_INT < 33) {
                boolean enabled = NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
                JSObject ret = new JSObject();
                ret.put("status", enabled ? "granted" : "settings-required");
                call.resolve(ret);
                return;
            }

            String targetAlias = alias;
            if ("storage".equalsIgnoreCase(alias)) {
                targetAlias = Build.VERSION.SDK_INT >= 33 ? "storageModern" : "storageLegacy";
            } else if ("nearby".equalsIgnoreCase(alias)) {
                targetAlias = Build.VERSION.SDK_INT >= 31 ? "nearbyModern" : "nearbyLegacy";
            }

            markRequested(alias);
            requestPermissionForAlias(targetAlias, call, "permissionCallback");
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
            if ("phone".equalsIgnoreCase(alias)) {
                return "granted";
            }

            if ("notifications".equalsIgnoreCase(alias)) {
                boolean enabled = NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
                if (!enabled) {
                    if (Build.VERSION.SDK_INT >= 33) {
                        int check = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS);
                        if (check == PackageManager.PERMISSION_GRANTED) {
                            return "settings-required";
                        }
                        boolean rationale = ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.POST_NOTIFICATIONS);
                        if (hasBeenRequested("notifications") && !rationale) {
                            return "settings-required";
                        }
                        return "prompt";
                    }
                    return "settings-required";
                }
                return "granted";
            }

            if ("camera".equalsIgnoreCase(alias)) {
                return checkSingle(Manifest.permission.CAMERA, "camera");
            }

            if ("microphone".equalsIgnoreCase(alias)) {
                return checkSingle(Manifest.permission.RECORD_AUDIO, "microphone");
            }

            if ("location".equalsIgnoreCase(alias)) {
                int fine = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION);
                int coarse = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION);
                if (fine == PackageManager.PERMISSION_GRANTED || coarse == PackageManager.PERMISSION_GRANTED) {
                    return "granted";
                }
                boolean ratFine = ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.ACCESS_FINE_LOCATION);
                boolean ratCoarse = ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.ACCESS_COARSE_LOCATION);
                if (hasBeenRequested("location") && !ratFine && !ratCoarse) {
                    return "settings-required";
                }
                return "prompt";
            }

            if ("contacts".equalsIgnoreCase(alias)) {
                return checkSingle(Manifest.permission.READ_CONTACTS, "contacts");
            }

            if ("storage".equalsIgnoreCase(alias)) {
                if (Build.VERSION.SDK_INT >= 33) {
                    int img = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_MEDIA_IMAGES);
                    int vid = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_MEDIA_VIDEO);
                    if (img == PackageManager.PERMISSION_GRANTED || vid == PackageManager.PERMISSION_GRANTED) {
                        return "granted";
                    }
                    boolean rat = ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.READ_MEDIA_IMAGES);
                    if (hasBeenRequested("storage") && !rat) {
                        return "settings-required";
                    }
                    return "prompt";
                } else {
                    return checkSingle(Manifest.permission.READ_EXTERNAL_STORAGE, "storage");
                }
            }

            if ("nearby".equalsIgnoreCase(alias)) {
                if (Build.VERSION.SDK_INT >= 31) {
                    int connect = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT);
                    if (connect == PackageManager.PERMISSION_GRANTED) {
                        return "granted";
                    }
                    boolean rat = ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.BLUETOOTH_CONNECT);
                    if (hasBeenRequested("nearby") && !rat) {
                        return "settings-required";
                    }
                    return "prompt";
                } else {
                    return checkSingle(Manifest.permission.BLUETOOTH, "nearby");
                }
            }

            return "prompt";
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
