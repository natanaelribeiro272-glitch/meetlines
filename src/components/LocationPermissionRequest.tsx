import { useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export const LocationPermissionRequest = () => {
  useEffect(() => {
    const requestInitialPermission = async () => {
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      try {
        console.log('Checking location permission on app start...');
        const permission = await Geolocation.checkPermissions();
        console.log('Current permission:', permission);

        if (permission.location !== 'granted') {
          console.log('Requesting location permission...');
          const result = await Geolocation.requestPermissions();
          console.log('Permission request result:', result);
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    };

    requestInitialPermission();
  }, []);

  return null;
};
