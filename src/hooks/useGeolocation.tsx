import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

interface GeolocationPosition {
  lat: number;
  lon: number;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
  requestPermission: () => Promise<boolean>;
  getCurrentPosition: () => Promise<GeolocationPosition | null>;
}

export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 27000,
    maximumAge = 30000,
    watch = false,
  } = options;

  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isNativePlatform = Capacitor.isNativePlatform();

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (isNativePlatform) {
        const permission = await Geolocation.checkPermissions();
        console.log('Current permission status:', permission);

        if (permission.location === 'denied') {
          setError('Permissão de localização negada. Ative nas configurações do app.');
          return false;
        }

        if (permission.location !== 'granted') {
          console.log('Requesting location permission...');
          const requested = await Geolocation.requestPermissions();
          console.log('Permission request result:', requested);

          if (requested.location !== 'granted') {
            setError('Permissão de localização negada.');
            return false;
          }
        }

        return true;
      } else {
        if (!navigator.geolocation) {
          setError('Geolocalização não suportada pelo navegador');
          return false;
        }
        return true;
      }
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError('Erro ao solicitar permissão de localização');
      return false;
    }
  };

  const getCurrentPosition = async (): Promise<GeolocationPosition | null> => {
    setLoading(true);
    setError(null);

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setLoading(false);
        return null;
      }

      if (isNativePlatform) {
        try {
          const coords = await Geolocation.getCurrentPosition({
            enableHighAccuracy,
            timeout,
            maximumAge,
          });

          const pos = {
            lat: coords.coords.latitude,
            lon: coords.coords.longitude,
          };

          setPosition(pos);
          setLoading(false);
          return pos;
        } catch (geoErr: any) {
          console.error('Geolocation error:', geoErr);
          let errorMessage = 'Erro ao obter localização';

          if (geoErr.message) {
            if (geoErr.message.includes('timeout')) {
              errorMessage = 'Tempo esgotado. Certifique-se de estar em local aberto.';
            } else if (geoErr.message.includes('denied')) {
              errorMessage = 'Permissão negada. Ative a localização nas configurações.';
            } else if (geoErr.message.includes('unavailable')) {
              errorMessage = 'Localização indisponível. Ative o GPS do dispositivo.';
            }
          }

          setError(errorMessage);
          setLoading(false);
          return null;
        }
      } else {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const position = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
              };
              setPosition(position);
              setLoading(false);
              resolve(position);
            },
            (err) => {
              console.error('Geolocation error:', err);
              let errorMessage = 'Erro ao obter localização';

              switch (err.code) {
                case err.PERMISSION_DENIED:
                  errorMessage = 'Permissão de localização negada';
                  break;
                case err.POSITION_UNAVAILABLE:
                  errorMessage = 'Localização indisponível. Ative o GPS.';
                  break;
                case err.TIMEOUT:
                  errorMessage = 'Tempo esgotado ao obter localização';
                  break;
              }

              setError(errorMessage);
              setLoading(false);
              resolve(null);
            },
            {
              enableHighAccuracy,
              timeout,
              maximumAge,
            }
          );
        });
      }
    } catch (err) {
      console.error('Error getting position:', err);
      setError('Erro ao obter localização');
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    if (!watch) return;

    let watchId: string | number | null = null;

    const startWatch = async () => {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      if (isNativePlatform) {
        watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy,
            timeout,
            maximumAge,
          },
          (pos, err) => {
            if (err) {
              console.error('Watch position error:', err);
              setError('Erro ao monitorar localização');
              return;
            }

            if (pos) {
              setPosition({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
              });
              setError(null);
            }
          }
        );
      } else {
        if (navigator.geolocation) {
          watchId = navigator.geolocation.watchPosition(
            (pos) => {
              setPosition({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
              });
              setError(null);
            },
            (err) => {
              console.error('Watch position error:', err);
              setError('Erro ao monitorar localização');
            },
            {
              enableHighAccuracy,
              timeout,
              maximumAge,
            }
          );
        }
      }
    };

    startWatch();

    return () => {
      if (watchId !== null) {
        if (isNativePlatform) {
          Geolocation.clearWatch({ id: watchId as string });
        } else {
          navigator.geolocation.clearWatch(watchId as number);
        }
      }
    };
  }, [watch, enableHighAccuracy, timeout, maximumAge, isNativePlatform]);

  return {
    position,
    error,
    loading,
    requestPermission,
    getCurrentPosition,
  };
}
