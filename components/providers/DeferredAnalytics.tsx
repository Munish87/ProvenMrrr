"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export function DeferredAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    // Start loading analytics after a small delay to let page interactive first
    const timer = setTimeout(() => {
      if (gaId && typeof window !== "undefined") {
        // Pre-load the Google Analytics script
        const script = document.createElement("script");
        script.defer = true;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
          (window.dataLayer as any[]).push(arguments);
        }
        window.gtag = gtag;
        gtag("js", new Date());
        gtag("config", gaId);
      }
    }, 2000); // Load after 2 seconds

    return () => clearTimeout(timer);
  }, [gaId]);

  return null;
}
