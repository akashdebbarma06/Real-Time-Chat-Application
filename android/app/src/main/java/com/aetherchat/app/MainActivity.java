package com.aetherchat.app;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
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
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
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
        setupWindowInsets();
    }

    private void setupWindowInsets() {
        try {
            Window window = getWindow();
            ViewCompat.setOnApplyWindowInsetsListener(window.getDecorView(), (v, windowInsets) -> {
                Insets statusInsets = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars());
                Insets navInsets = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars());
                Insets displayCutoutInsets = windowInsets.getInsets(WindowInsetsCompat.Type.displayCutout());

                int topPx = Math.max(statusInsets.top, displayCutoutInsets.top);
                int bottomPx = Math.max(navInsets.bottom, displayCutoutInsets.bottom);

                float density = getResources().getDisplayMetrics().density;
                final int topDp = density > 0 ? Math.round(topPx / density) : 0;
                final int bottomDp = density > 0 ? Math.round(bottomPx / density) : 0;

                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().post(() -> {
                        try {
                            String js = String.format(
                                "document.documentElement.style.setProperty('--safe-area-inset-top', '%dpx');" +
                                "document.documentElement.style.setProperty('--safe-area-inset-bottom', '%dpx');",
                                topDp, bottomDp
                            );
                            getBridge().getWebView().evaluateJavascript(js, null);
                        } catch (Exception ignored) {}
                    });
                }
                return windowInsets;
            });
        } catch (Exception ignored) {}
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
            ),
            @Permission(
                alias = "notifications",
                strings = { Manifest.permission.POST_NOTIFICATIONS }
            ),
            @Permission(
                alias = "location",
                strings = {
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                }
            ),
            @Permission(
                alias = "contacts",
                strings = { Manifest.permission.READ_CONTACTS }
            ),
            @Permission(
                alias = "storage_media",
                strings = {
                    Manifest.permission.READ_MEDIA_IMAGES,
                    Manifest.permission.READ_MEDIA_VIDEO
                }
            ),
            @Permission(
                alias = "storage_legacy",
                strings = {
                    Manifest.permission.READ_EXTERNAL_STORAGE
                }
            ),
            @Permission(
                alias = "nearby",
                strings = {
                    Manifest.permission.BLUETOOTH_CONNECT,
                    Manifest.permission.BLUETOOTH_SCAN
                }
            ),
            @Permission(
                alias = "phone",
                strings = {
                    Manifest.permission.CALL_PHONE
                }
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
            if (alias == null || alias.trim().isEmpty()) {
                call.reject("Alias is required");
                return;
            }

            String normalized = alias.trim().toLowerCase();

            switch (normalized) {
                case "camera": {
                    if (!getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)
                            && !getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA)) {
                        JSObject ret = new JSObject();
                        ret.put("status", "unsupported");
                        call.resolve(ret);
                        return;
                    }
                    markRequested("camera");
                    requestPermissionForAlias("camera", call, "permissionCallback");
                    return;
                }

                case "microphone": {
                    if (!getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_MICROPHONE)) {
                        JSObject ret = new JSObject();
                        ret.put("status", "unsupported");
                        call.resolve(ret);
                        return;
                    }
                    markRequested("microphone");
                    requestPermissionForAlias("microphone", call, "permissionCallback");
                    return;
                }

                case "notifications": {
                    markRequested("notifications");
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        requestPermissionForAlias("notifications", call, "permissionCallback");
                        return;
                    }

                    NotificationManagerCompat notifManager = NotificationManagerCompat.from(getContext());
                    if (notifManager.areNotificationsEnabled()) {
                        JSObject ret = new JSObject();
                        ret.put("status", "granted");
                        call.resolve(ret);
                        return;
                    }

                    try {
                        Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                        intent.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(intent);
                    } catch (Exception e) {
                        openAppSettingsInternal();
                    }

                    JSObject ret = new JSObject();
                    ret.put("status", "settings-required");
                    call.resolve(ret);
                    return;
                }

                case "location": {
                    boolean hasLocation = getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_LOCATION)
                            || getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_LOCATION_GPS)
                            || getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_LOCATION_NETWORK);
                    if (!hasLocation) {
                        JSObject ret = new JSObject();
                        ret.put("status", "unsupported");
                        call.resolve(ret);
                        return;
                    }
                    markRequested("location");
                    requestPermissionForAlias("location", call, "permissionCallback");
                    return;
                }

                case "contacts": {
                    markRequested("contacts");
                    requestPermissionForAlias("contacts", call, "permissionCallback");
                    return;
                }

                case "storage":
                case "storage_media":
                case "storage_legacy": {
                    markRequested("storage");
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        requestPermissionForAlias("storage_media", call, "permissionCallback");
                    } else {
                        requestPermissionForAlias("storage_legacy", call, "permissionCallback");
                    }
                    return;
                }

                case "nearby": {
                    if (!getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH)) {
                        JSObject ret = new JSObject();
                        ret.put("status", "unsupported");
                        call.resolve(ret);
                        return;
                    }
                    markRequested("nearby");
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        requestPermissionForAlias("nearby", call, "permissionCallback");
                        return;
                    }

                    BluetoothAdapter adapter = getBluetoothAdapter();
                    if (adapter == null) {
                        JSObject ret = new JSObject();
                        ret.put("status", "unsupported");
                        call.resolve(ret);
                        return;
                    }

                    if (adapter.isEnabled()) {
                        JSObject ret = new JSObject();
                        ret.put("status", "granted");
                        call.resolve(ret);
                        return;
                    }

                    try {
                        Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
                        enableBtIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(enableBtIntent);
                    } catch (Exception e) {
                        try {
                            Intent intent = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS);
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            getContext().startActivity(intent);
                        } catch (Exception ignored) {}
                    }

                    JSObject ret = new JSObject();
                    ret.put("status", "prompt");
                    call.resolve(ret);
                    return;
                }

                case "phone": {
                    boolean hasTelephony = getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_TELEPHONY);
                    Intent dialIntent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:1234567890"));
                    boolean canDial = dialIntent.resolveActivity(getContext().getPackageManager()) != null;
                    if (!hasTelephony && !canDial) {
                        JSObject ret = new JSObject();
                        ret.put("status", "unsupported");
                        call.resolve(ret);
                        return;
                    }
                    markRequested("phone");
                    requestPermissionForAlias("phone", call, "permissionCallback");
                    return;
                }

                default: {
                    JSObject ret = new JSObject();
                    ret.put("status", "unsupported");
                    call.resolve(ret);
                    return;
                }
            }
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
                openAppSettingsInternal();
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to open application settings: " + e.getMessage(), e);
            }
        }

        private void openAppSettingsInternal() {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package", getContext().getPackageName(), null);
            intent.setData(uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
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

        private BluetoothAdapter getBluetoothAdapter() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    BluetoothManager bm = getContext().getSystemService(BluetoothManager.class);
                    if (bm != null) {
                        return bm.getAdapter();
                    }
                }
                return BluetoothAdapter.getDefaultAdapter();
            } catch (Exception ignored) {
                return null;
            }
        }

        private String computePermissionStatus(String alias) {
            if (alias == null || alias.trim().isEmpty()) {
                return "unsupported";
            }

            String normalized = alias.trim().toLowerCase();

            switch (normalized) {
                case "camera": {
                    if (!getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)
                            && !getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA)) {
                        return "unsupported";
                    }
                    return checkSingle(Manifest.permission.CAMERA, "camera");
                }

                case "microphone": {
                    if (!getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_MICROPHONE)) {
                        return "unsupported";
                    }
                    return checkSingle(Manifest.permission.RECORD_AUDIO, "microphone");
                }

                case "notifications": {
                    NotificationManagerCompat notifManager = NotificationManagerCompat.from(getContext());
                    boolean areEnabled = notifManager.areNotificationsEnabled();

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        int check = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS);
                        if (check == PackageManager.PERMISSION_GRANTED && areEnabled) {
                            return "granted";
                        }
                        Activity activity = getActivity();
                        boolean rationale = activity != null && ActivityCompat.shouldShowRequestPermissionRationale(activity, Manifest.permission.POST_NOTIFICATIONS);
                        if (hasBeenRequested("notifications") && !rationale) {
                            return "settings-required";
                        }
                        if (!areEnabled && hasBeenRequested("notifications")) {
                            return "settings-required";
                        }
                        return "prompt";
                    } else {
                        if (areEnabled) {
                            return "granted";
                        }
                        return hasBeenRequested("notifications") ? "settings-required" : "prompt";
                    }
                }

                case "location": {
                    boolean hasLocation = getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_LOCATION)
                            || getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_LOCATION_GPS)
                            || getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_LOCATION_NETWORK);
                    if (!hasLocation) {
                        return "unsupported";
                    }

                    int fine = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION);
                    int coarse = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION);

                    if (fine == PackageManager.PERMISSION_GRANTED) {
                        return "granted";
                    }
                    if (coarse == PackageManager.PERMISSION_GRANTED) {
                        return "limited";
                    }

                    Activity activity = getActivity();
                    boolean fineRationale = activity != null && ActivityCompat.shouldShowRequestPermissionRationale(activity, Manifest.permission.ACCESS_FINE_LOCATION);
                    boolean coarseRationale = activity != null && ActivityCompat.shouldShowRequestPermissionRationale(activity, Manifest.permission.ACCESS_COARSE_LOCATION);

                    if (hasBeenRequested("location") && !fineRationale && !coarseRationale) {
                        return "settings-required";
                    }
                    return "prompt";
                }

                case "contacts": {
                    return checkSingle(Manifest.permission.READ_CONTACTS, "contacts");
                }

                case "storage":
                case "storage_media":
                case "storage_legacy": {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        int imgCheck = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_MEDIA_IMAGES);
                        int vidCheck = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_MEDIA_VIDEO);

                        if (imgCheck == PackageManager.PERMISSION_GRANTED || vidCheck == PackageManager.PERMISSION_GRANTED) {
                            return "granted";
                        }

                        if (Build.VERSION.SDK_INT >= 34) {
                            int partialCheck = ContextCompat.checkSelfPermission(getContext(), "android.permission.READ_MEDIA_VISUAL_USER_SELECTED");
                            if (partialCheck == PackageManager.PERMISSION_GRANTED) {
                                return "limited";
                            }
                        }

                        Activity activity = getActivity();
                        boolean imgRationale = activity != null && ActivityCompat.shouldShowRequestPermissionRationale(activity, Manifest.permission.READ_MEDIA_IMAGES);
                        if (hasBeenRequested("storage") && !imgRationale) {
                            return "settings-required";
                        }
                        return "prompt";
                    } else {
                        return checkSingle(Manifest.permission.READ_EXTERNAL_STORAGE, "storage");
                    }
                }

                case "nearby": {
                    if (!getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH)) {
                        return "unsupported";
                    }

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        int connectCheck = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT);
                        if (connectCheck == PackageManager.PERMISSION_GRANTED) {
                            return "granted";
                        }
                        Activity activity = getActivity();
                        boolean rationale = activity != null && ActivityCompat.shouldShowRequestPermissionRationale(activity, Manifest.permission.BLUETOOTH_CONNECT);
                        if (hasBeenRequested("nearby") && !rationale) {
                            return "settings-required";
                        }
                        return "prompt";
                    } else {
                        BluetoothAdapter adapter = getBluetoothAdapter();
                        if (adapter == null) {
                            return "unsupported";
                        }
                        return adapter.isEnabled() ? "granted" : "prompt";
                    }
                }

                case "phone": {
                    boolean hasTelephony = getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_TELEPHONY);
                    Intent dialIntent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:1234567890"));
                    boolean canDial = dialIntent.resolveActivity(getContext().getPackageManager()) != null;
                    if (!hasTelephony && !canDial) {
                        return "unsupported";
                    }
                    return checkSingle(Manifest.permission.CALL_PHONE, "phone");
                }

                default:
                    return "unsupported";
            }
        }

        private String checkSingle(String permString, String alias) {
            int check = ContextCompat.checkSelfPermission(getContext(), permString);
            if (check == PackageManager.PERMISSION_GRANTED) {
                return "granted";
            }
            Activity activity = getActivity();
            boolean rationale = activity != null && ActivityCompat.shouldShowRequestPermissionRationale(activity, permString);
            if (hasBeenRequested(alias) && !rationale) {
                return "settings-required";
            }
            return "prompt";
        }
    }
}
