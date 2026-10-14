package com.aetherchat.app;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Window;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

public class MainActivity extends BridgeActivity {
    public static final String NOTIFICATION_CHANNEL_ID = "aether_chat_channel";
    public static final String NOTIFICATION_CHANNEL_NAME = "AetherChat Messages";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppIconPlugin.class);
        registerPlugin(NativePermissionsPlugin.class);
        registerPlugin(NativeCameraPlugin.class);
        registerPlugin(SystemThemePlugin.class);
        registerPlugin(NativeNotificationsPlugin.class);
        super.onCreate(savedInstanceState);

        setupNotificationChannel();
        applyStoredSystemBarsTheme();
    }

    private void setupNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Incoming chat messages and notifications");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 250, 250, 250});
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PRIVATE);
            channel.setShowBadge(true);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void applyStoredSystemBarsTheme() {
        try {
            SharedPreferences prefs = getSharedPreferences("aether_theme_prefs", Context.MODE_PRIVATE);
            boolean isDark = prefs.getBoolean("is_dark", true);
            String navBarColor = prefs.getString("navbar_color", isDark ? "#09090b" : "#ffffff");
            Window window = getWindow();
            WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
            if (insetsController != null) {
                insetsController.setAppearanceLightStatusBars(!isDark);
                insetsController.setAppearanceLightNavigationBars(!isDark);
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                window.setNavigationBarColor(Color.parseColor(navBarColor));
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onResume() {
        super.onResume();
        applyStoredSystemBarsTheme();
    }

    @Override
    protected void onNewIntent(Intent intent) {
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

    @CapacitorPlugin(name = "SystemTheme")
    public static class SystemThemePlugin extends Plugin {
        @PluginMethod
        public void setSystemBarsTheme(PluginCall call) {
            final boolean isDark = call.getBoolean("isDark", true);
            final String navBarColor = call.getString("navBarColor", isDark ? "#09090b" : "#ffffff");

            Activity activity = getActivity();
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    try {
                        Window window = activity.getWindow();
                        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
                        if (insetsController != null) {
                            insetsController.setAppearanceLightStatusBars(!isDark);
                            insetsController.setAppearanceLightNavigationBars(!isDark);
                        }
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            window.setNavigationBarColor(Color.parseColor(navBarColor));
                        }
                        SharedPreferences prefs = getContext().getSharedPreferences("aether_theme_prefs", Context.MODE_PRIVATE);
                        prefs.edit().putBoolean("is_dark", isDark).putString("navbar_color", navBarColor).apply();
                        call.resolve();
                    } catch (Exception e) {
                        call.reject("Failed to set system bars theme: " + e.getMessage(), e);
                    }
                });
            } else {
                call.resolve();
            }
        }
    }

    @CapacitorPlugin(
        name = "NativeNotifications",
        permissions = {
            @Permission(
                alias = "notifications",
                strings = { "android.permission.POST_NOTIFICATIONS" }
            )
        }
    )
    public static class NativeNotificationsPlugin extends Plugin {
        @PluginMethod
        public void checkPermission(PluginCall call) {
            boolean granted = true;
            if (Build.VERSION.SDK_INT >= 33) {
                granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
            }
            JSObject ret = new JSObject();
            ret.put("granted", granted);
            call.resolve(ret);
        }

        @PluginMethod
        public void requestPermission(PluginCall call) {
            if (Build.VERSION.SDK_INT >= 33) {
                if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
                    JSObject ret = new JSObject();
                    ret.put("granted", true);
                    call.resolve(ret);
                    return;
                }
                requestPermissionForAlias("notifications", call, "notificationsCallback");
            } else {
                JSObject ret = new JSObject();
                ret.put("granted", true);
                call.resolve(ret);
            }
        }

        @PermissionCallback
        public void notificationsCallback(PluginCall call) {
            boolean granted = true;
            if (Build.VERSION.SDK_INT >= 33) {
                granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
            }
            JSObject ret = new JSObject();
            ret.put("granted", granted);
            call.resolve(ret);
        }

        @PluginMethod
        public void showNotification(PluginCall call) {
            try {
                String title = call.getString("title", "AetherChat");
                String body = call.getString("body", "New message received");
                String conversationId = call.getString("conversationId", "");
                int notificationId = call.getInt("id", (int) System.currentTimeMillis());

                Intent intent = new Intent(getContext(), MainActivity.class);
                intent.setAction(Intent.ACTION_VIEW);
                if (conversationId != null && !conversationId.isEmpty()) {
                    intent.setData(Uri.parse("aetherchat://conversation/" + conversationId));
                    intent.putExtra("conversationId", conversationId);
                }
                intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags |= PendingIntent.FLAG_IMMUTABLE;
                }
                PendingIntent pendingIntent = PendingIntent.getActivity(
                    getContext(),
                    notificationId,
                    intent,
                    flags
                );

                NotificationCompat.Builder builder = new NotificationCompat.Builder(getContext(), NOTIFICATION_CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setAutoCancel(true)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setDefaults(NotificationCompat.DEFAULT_ALL)
                    .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
                    .setContentIntent(pendingIntent);

                NotificationManagerCompat.from(getContext()).notify(notificationId, builder.build());
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to show notification: " + e.getMessage(), e);
            }
        }
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
                    int current = pm.getComponentEnabledSetting(comp);
                    if (current != state) {
                        pm.setComponentEnabledSetting(comp, state, PackageManager.DONT_KILL_APP);
                    }
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
