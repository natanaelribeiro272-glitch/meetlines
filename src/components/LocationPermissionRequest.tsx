import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { requestLocationPermission } from '@/lib/permissions';

export const LocationPermissionRequest = () => {
  useEffect(() => {
    const requestInitialPermission = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.log('Not a native platform, skipping location permission');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        console.log('=== Requesting location permission ===');
        const granted = await requestLocationPermission();

        if (granted) {
          console.log('✓ Location permission granted successfully');
        } else {
          console.log('✗ Location permission was denied');
        }
      } catch (error) {
        console.error('✗ Error requesting location permission:', error);
      }
    };

    requestInitialPermission();
  }, []);

  return null;
};
