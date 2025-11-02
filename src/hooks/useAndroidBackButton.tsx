import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

export const useAndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let backButtonListener: any = null;

    const setupBackButton = async () => {
      try {
        const { App: CapacitorApp } = await import('@capacitor/app');

        backButtonListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          const currentPath = location.pathname;

          const homePaths = ['/', '/home'];
          const isHomePage = homePaths.includes(currentPath);

          if (isHomePage) {
            CapacitorApp.exitApp();
          } else if (canGoBack) {
            navigate(-1);
          } else {
            navigate('/');
          }
        });
      } catch (error) {
        console.log('Back button listener not available:', error);
      }
    };

    setupBackButton();

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [navigate, location]);
};
