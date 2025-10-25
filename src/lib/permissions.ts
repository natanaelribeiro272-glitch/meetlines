import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.error('Permissão de notificação não foi concedida pelo usuário.');
      return false;
    }

    console.log('Permissão de notificação concedida. Registrando o dispositivo...');
    await PushNotifications.register();
    return true;
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificação:', error);
    return false;
  }
};

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    let permStatus = await Geolocation.checkPermissions();

    if (permStatus.location === 'prompt' || permStatus.location === 'prompt-with-rationale') {
      permStatus = await Geolocation.requestPermissions();
    }

    if (permStatus.location === 'denied') {
      console.error('Permissão de localização foi negada.');
      return false;
    }

    console.log('Permissão de localização concedida.');
    return true;
  } catch (error) {
    console.error('Erro ao gerenciar permissão de localização:', error);
    return false;
  }
};

export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      throw new Error('Permissão de localização não concedida');
    }

    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });

    console.log('Localização atual:', coordinates);
    return coordinates;
  } catch (error) {
    console.error('Erro ao obter localização:', error);
    throw error;
  }
};

export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    let permStatus = await Camera.checkPermissions();

    if (permStatus.camera === 'prompt' || permStatus.camera === 'prompt-with-rationale') {
      permStatus = await Camera.requestPermissions({ permissions: ['camera'] });
    }

    if (permStatus.camera === 'denied') {
      console.error('Permissão de câmera foi negada.');
      return false;
    }

    console.log('Permissão de câmera concedida.');
    return true;
  } catch (error) {
    console.error('Erro ao gerenciar permissão de câmera:', error);
    return false;
  }
};

export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    const permStatus = await PushNotifications.checkPermissions();
    return permStatus.receive === 'granted';
  } catch (error) {
    console.error('Erro ao verificar permissão de notificação:', error);
    return false;
  }
};

export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    const permStatus = await Geolocation.checkPermissions();
    return permStatus.location === 'granted';
  } catch (error) {
    console.error('Erro ao verificar permissão de localização:', error);
    return false;
  }
};

export const checkCameraPermission = async (): Promise<boolean> => {
  try {
    const permStatus = await Camera.checkPermissions();
    return permStatus.camera === 'granted';
  } catch (error) {
    console.error('Erro ao verificar permissão de câmera:', error);
    return false;
  }
};
