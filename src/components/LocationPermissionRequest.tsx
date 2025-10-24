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

      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        console.log('=== Starting location permission request ===');

        const result = await Geolocation.requestPermissions({
          permissions: ['location', 'coarseLocation']
        });

        console.log('Permission request completed:', JSON.stringify(result));

        if (result.location === 'granted' || result.coarseLocation === 'granted') {
          console.log('Location permission granted successfully');
        } else {
          console.log('Location permission was denied');
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
        console.error('Error details:', JSON.stringify(error));
      }
    };

    requestInitialPermission();
  }, []);

  return null;
};
