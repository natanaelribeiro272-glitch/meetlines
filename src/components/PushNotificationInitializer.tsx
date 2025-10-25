import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { requestNotificationPermission } from '@/lib/permissions';
import { useAuth } from '@/hooks/useAuth';

export function PushNotificationInitializer() {
  const { user } = useAuth();

  useEffect(() => {
    const requestInitialPermission = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.log('Not a native platform, skipping notification permission');
        return;
      }

      if (!user) {
        console.log('No user logged in, skipping notification permission');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        console.log('=== Requesting notification permission ===');
        const granted = await requestNotificationPermission();

        if (granted) {
          console.log('✓ Notification permission granted successfully');
        } else {
          console.log('✗ Notification permission was denied');
        }
      } catch (error) {
        console.error('✗ Error requesting notification permission:', error);
      }
    };

    requestInitialPermission();
  }, [user]);

  return null;
}
