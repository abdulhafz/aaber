import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moarab.smart',
  appName: 'Arabic Grammar Analyzer',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
