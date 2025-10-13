import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e6b636ea6cdd49b2bbe1fd78ce5bb5d3',
  appName: 'meetlines',
  webDir: 'dist',
  server: {
    url: 'https://e6b636ea-6cdd-49b2-bbe1-fd78ce5bb5d3.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    BarcodeScanner: {
      // Configure permissions
    }
  }
};

export default config;
