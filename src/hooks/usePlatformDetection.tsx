import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export function usePlatformDetection() {
  const [platformInfo, setPlatformInfo] = useState({
    isNativeApp: false,
    isWebBrowser: true,
    isMobileWeb: false,
    platform: "web" as "web" | "ios" | "android"
  });

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    setPlatformInfo({
      isNativeApp: isNative,
      isWebBrowser: !isNative,
      isMobileWeb: !isNative && isMobile,
      platform: platform as "web" | "ios" | "android"
    });
  }, []);

  return platformInfo;
}
