import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const isPlatformSupported = Capacitor.isNativePlatform();
    setIsSupported(isPlatformSupported);

    if (!isPlatformSupported || !user) {
      return;
    }

    initializePushNotifications();
  }, [user]);

  const initializePushNotifications = async () => {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        setPermissionStatus('denied');
        console.log('Push notification permission denied');
        return;
      }

      setPermissionStatus('granted');

      await PushNotifications.register();

      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token:', token.value);
        await savePushToken(token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
        toast.error('Erro ao registrar notificações push');
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
        toast.success(notification.title || 'Nova notificação', {
          description: notification.body,
        });
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed:', notification);
      });

    } catch (error) {
      console.error('Error initializing push notifications:', error);
      setIsSupported(false);
    }
  };

  const savePushToken = async (token: string) => {
    if (!user) return;

    try {
      const platform = Capacitor.getPlatform() as 'ios' | 'android';

      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform,
          device_info: {
            platform,
            capacitor_version: Capacitor.getPlatform(),
          },
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token',
        });

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully');
      }
    } catch (error) {
      console.error('Error in savePushToken:', error);
    }
  };

  const removePushToken = async (token: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', token);

      if (error) {
        console.error('Error removing push token:', error);
      }
    } catch (error) {
      console.error('Error in removePushToken:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Notificações push não suportadas neste dispositivo');
      return false;
    }

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      const permStatus = await PushNotifications.requestPermissions();

      if (permStatus.receive === 'granted') {
        setPermissionStatus('granted');
        await PushNotifications.register();
        toast.success('Notificações ativadas!');
        return true;
      } else {
        setPermissionStatus('denied');
        toast.error('Permissão de notificações negada');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Erro ao solicitar permissão');
      return false;
    }
  };

  return {
    isSupported,
    permissionStatus,
    requestPermission,
    removePushToken,
  };
}
