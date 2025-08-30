import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aienglishtutor.app',
  appName: 'AI English Tutor',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    },
    App: {
      allowDiskUsage: true
    }
  }
};

export default config;