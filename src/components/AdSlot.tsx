import React, { useContext, useEffect } from 'react';
import { AdSettingsContext } from './AdSettingsContext';

interface AdSlotProps {
  variant: 'leaderboard' | 'rectangle';
  slotLabel?: string;
}

let adsbygoogleLoaded = false;

function loadAdsbyGoogle(): void {
  if (adsbygoogleLoaded || typeof window === 'undefined') return;
  adsbygoogleLoaded = true;
  const script = document.createElement('script');
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.client.js';
  script.async = true;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

/**
 * Reserved ad slot container engineered to prevent Cumulative Layout Shift (CLS = 0).
 * Reserves explicit dimensions matching standard Google AdSense responsive units.
 * Renders an actual <ins class="adsbygoogle"> element when ads are enabled and a client ID
 * is configured; otherwise renders nothing.
 */
export const AdSlot: React.FC<AdSlotProps> = ({ variant, slotLabel = 'Advertisement' }) => {
  const adSettings = useContext(AdSettingsContext);
  if (!adSettings.enabled || !adSettings.clientId) return null;

  const slotId = variant === 'leaderboard' ? adSettings.slotLeaderboard : adSettings.slotRectangle;

  const dimensions =
    variant === 'leaderboard'
      ? 'min-h-[90px] w-full'
      : 'min-h-[250px] w-full';

  useEffect(() => {
    loadAdsbyGoogle();
    if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
      (window as any).adsbygoogle.push({});
    }
  }, []);

  return (
    <aside
      aria-label={slotLabel}
      className={`${dimensions} flex flex-col items-center justify-center rounded-xl border border-hairline bg-sand/70 px-4 py-5 text-center`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adSettings.clientId}
        data-ad-slot={slotId || 'ca-pub-test'}
        data-ad-format="auto"
      ></ins>
    </aside>
  );
};
