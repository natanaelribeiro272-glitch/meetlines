import { useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export const LocationPermissionRequest = () => {
  useEffect(() => {
    const requestInitialPermission = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.log('Not a native platform, skipping location permission');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        console.log('=== Checking location permission status ===');

        const currentPermission = await Geolocation.checkPermissions();
        console.log('Current permission:', JSON.stringify(currentPermission));

        if (currentPermission.location !== 'granted') {
          console.log('Requesting location permission...');
          const result = await Geolocation.requestPermissions();
          console.log('Permission request result:', JSON.stringify(result));

          if (result.location === 'granted' || result.coarseLocation === 'granted') {
            console.log('✓ Location permission granted successfully');
          } else {
            console.log('✗ Location permission was denied');
          }
        } else {
          console.log('✓ Location permission already granted');
        }
      } catch (error) {
        console.error('✗ Error requesting location permission:', error);
      }
    };

    requestInitialPermission();
  }, []);

  return null;
};
