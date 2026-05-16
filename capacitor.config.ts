import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.peacecars.admin',
  appName: 'PeaceCars Admin',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
