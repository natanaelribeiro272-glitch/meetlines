import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meetlines.meetlinesapp',
  appName: 'Meetlines',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    hostname: 'localhost'
  },
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
    captureInput: true,
    webContentsDebuggingEnabled: true,
    loggingBehavior: 'debug'
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
