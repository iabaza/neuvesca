"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const META_PIXEL_ID = "3593424810832594";

export default function MetaPixel() {
  const pathname = usePathname();
  const isInitialRender = useRef(true);

  useEffect(() => {
    // The base snippet below already fires PageView on first load. The site
    // navigates client-side, so without this the pixel would only ever record
    // one PageView per visit — fire it again on each subsequent route change.
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    fbq?.("track", "PageView");
  }, [pathname]);

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
    </>
  );
}

// Meta's snippet ships a <noscript> tracking pixel as a fallback. It is
// deliberately omitted: React renders the fallback image such that it fires
// even when JavaScript is enabled, double-counting every PageView. The store
// requires JavaScript for cart and checkout, so a no-JS visitor cannot convert
// and there is nothing meaningful for that fallback to record.
