"use client";

import { useEffect } from "react";
import Script from "next/script";
import { captureAttribution } from "@/lib/analytics/attribution";
import { setAnalyticsIds } from "@/lib/analytics/runtime";
import type { AnalyticsIds } from "@/lib/analytics/ids";

export function AnalyticsProvider({ ids }: { ids: AnalyticsIds }) {
  // Робимо id доступними подієвому шару (gtagConversion/fbqTrack) до перших подій.
  setAnalyticsIds(ids);

  useEffect(() => {
    captureAttribution();
  }, []);

  const gtagId = ids.ga || ids.adsId;

  return (
    <>
      {ids.gtm && (
        <>
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${ids.gtm}');`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${ids.gtm}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="gtm"
            />
          </noscript>
        </>
      )}

      {!ids.gtm && gtagId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${ids.ga ? `gtag('config','${ids.ga}');` : ""}${ids.adsId ? `gtag('config','${ids.adsId}');` : ""}`}
          </Script>
        </>
      )}

      {ids.pixel && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${ids.pixel}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
