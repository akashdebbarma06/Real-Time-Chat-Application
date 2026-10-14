import type { CapacitorConfig } from '@capacitor/cli';

// Reserve server.url strictly for deliberate development / live-reload configurations.
// In production builds, the APK loads the bundled web assets from the local webDir ('out')
// over a secure local origin (https://localhost) without exposing native plugins to remote origins.
const devServerUrl = process.env.CAPACITOR_DEV_SERVER_URL;
const isDev = Boolean(devServerUrl);

const config: CapacitorConfig = {
  appId: 'com.aetherchat.app',
  appName: 'AetherChat',
  webDir: 'out',
  server: {
    ...(isDev && devServerUrl ? { url: devServerUrl } : {}),
    // Cleartext is disabled in production. Only allowed if an explicit HTTP development URL is provided.
    cleartext: isDev && devServerUrl ? devServerUrl.startsWith('http://') : false,
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true,
    },
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      style: 'DARK',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: "#09090b",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_INSIDE",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;

