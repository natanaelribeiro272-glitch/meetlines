import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meetlines.app',
  appName: 'Meetlines',
  webDir: 'dist',
  plugins: {
    BarcodeScanner: {
      cameraPermission: 'always'
    },
    Camera: {
      permissions: {
        photos: 'always',
        camera: 'always'
      }
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
