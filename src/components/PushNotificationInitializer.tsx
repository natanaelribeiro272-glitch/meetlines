import { useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';

export function PushNotificationInitializer() {
  const { user } = useAuth();
  const { isSupported } = usePushNotifications();

  useEffect(() => {
    if (user && isSupported) {
      console.log('Push notifications initialized for user:', user.id);
    }
  }, [user, isSupported]);

  return null;
}
