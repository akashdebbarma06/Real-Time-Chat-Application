package com.aetherchat.app;

import android.content.ComponentName;
import android.content.pm.PackageManager;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppIconPlugin.class);
        super.onCreate(savedInstanceState);
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
}
