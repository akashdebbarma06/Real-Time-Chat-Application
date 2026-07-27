import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chatsphere.app',
  appName: 'ChatSphere',
  webDir: 'out',

  // ── Hosted WebView ─────────────────────────────────────────────
  // Replace the URL below with your deployed Vercel/Netlify URL.
  // Comment out the entire `server` block when building a static
  // (offline-capable) version instead.
  server: {
    url: 'https://chatsphere-tan.vercel.app',
    cleartext: false, // HTTPS only
  },

  // ── Android-specific settings ──────────────────────────────────
  android: {
    backgroundColor: '#09090b',
    allowMixedContent: false,
    buildOptions: {
      signingType: 'apksigner',
    },
  },

  // ── Plugins (optional — install separately if needed) ──────────
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#09090b',
      showSpinner: true,
      spinnerColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#09090b',
    },
  },
};

export default config;
