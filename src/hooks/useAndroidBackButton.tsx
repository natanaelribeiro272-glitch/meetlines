import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const useAndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleBackButton = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
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

    return () => {
      handleBackButton.remove();
    };
  }, [navigate, location]);
};
