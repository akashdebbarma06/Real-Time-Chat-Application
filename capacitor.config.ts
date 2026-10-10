import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aetherchat.app',
  appName: 'AetherChat',
  webDir: 'out',
  server: {
    url: 'https://chatsphere-tan.vercel.app',
    cleartext: true,
  },
};

export default config;

