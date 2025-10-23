import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EventPixel {
  id: string;
  platform: string;
  pixel_id: string;
  is_active: boolean;
}

export function useEventPixels(eventId: string | null) {
  const [pixels, setPixels] = useState<EventPixel[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    loadPixels();
  }, [eventId]);

  const loadPixels = async () => {
    try {
      const { data, error } = await supabase
        .from("event_pixels")
        .select("*")
        .eq("event_id", eventId)
        .eq("is_active", true);

      if (error) throw error;

      if (data && data.length > 0) {
        setPixels(data);
        injectPixels(data);
      }

      setLoaded(true);
    } catch (error) {
      console.error("Error loading pixels:", error);
      setLoaded(true);
    }
  };

  const injectPixels = (pixelsToInject: EventPixel[]) => {
    pixelsToInject.forEach((pixel) => {
      switch (pixel.platform) {
        case "facebook":
          injectFacebookPixel(pixel.pixel_id);
          break;
        case "google_ads":
          injectGoogleAdsPixel(pixel.pixel_id);
          break;
        case "tiktok":
          injectTikTokPixel(pixel.pixel_id);
          break;
        case "linkedin":
          injectLinkedInPixel(pixel.pixel_id);
          break;
        case "twitter":
          injectTwitterPixel(pixel.pixel_id);
          break;
        case "custom":
          injectCustomPixel(pixel.pixel_id);
          break;
      }
    });
  };

  const injectFacebookPixel = (pixelId: string) => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    const noscript = document.createElement("noscript");
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
    document.body.appendChild(noscript);
  };

  const injectGoogleAdsPixel = (pixelId: string) => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${pixelId}`;
    document.head.appendChild(script);

    const inlineScript = document.createElement("script");
    inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${pixelId}');
    `;
    document.head.appendChild(inlineScript);
  };

  const injectTikTokPixel = (pixelId: string) => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.innerHTML = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        ttq.load('${pixelId}');
        ttq.page();
      }(window, document, 'ttq');
    `;
    document.head.appendChild(script);
  };

  const injectLinkedInPixel = (pixelId: string) => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.innerHTML = `
      _linkedin_partner_id = "${pixelId}";
      window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
      window._linkedin_data_partner_ids.push(_linkedin_partner_id);
    `;
    document.head.appendChild(script);

    const insightScript = document.createElement("script");
    insightScript.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
    insightScript.async = true;
    document.head.appendChild(insightScript);
  };

  const injectTwitterPixel = (pixelId: string) => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.innerHTML = `
      !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
      },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
      a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
      twq('config','${pixelId}');
    `;
    document.head.appendChild(script);
  };

  const injectCustomPixel = (pixelCode: string) => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.innerHTML = pixelCode;
    document.head.appendChild(script);
  };

  const trackEvent = (eventName: string, data?: any) => {
    if (!loaded || pixels.length === 0) return;

    pixels.forEach((pixel) => {
      switch (pixel.platform) {
        case "facebook":
          if ((window as any).fbq) {
            (window as any).fbq("track", eventName, data);
          }
          break;
        case "google_ads":
          if ((window as any).gtag) {
            (window as any).gtag("event", eventName, data);
          }
          break;
        case "tiktok":
          if ((window as any).ttq) {
            (window as any).ttq.track(eventName, data);
          }
          break;
        case "twitter":
          if ((window as any).twq) {
            (window as any).twq("track", eventName, data);
          }
          break;
      }
    });
  };

  return {
    pixels,
    loaded,
    trackEvent
  };
}
