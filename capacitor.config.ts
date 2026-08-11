import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sportsphere.app',
  appName: 'SportSphere',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // Restrict navigation to your own domain only.
    // Replace with your actual production domain before building.
    allowNavigation: ['sportssphere.fun', '*.sportssphere.fun'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
    },
    Keyboard: {
      resize: 'none',
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#000000',
    allowMixedContent: false, // Never allow HTTP content in an HTTPS app
  },
};

export default config;
