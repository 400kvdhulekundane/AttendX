import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.attendance',
  appName: 'AttendanceApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;