import React, { useContext } from 'react';
import { AdSettingsContext } from './AdSettingsContext';

interface AdSlotProps {
  variant: 'leaderboard' | 'rectangle';
  slotLabel?: string;
}

/**
 * Reserved ad slot container engineered to prevent Cumulative Layout Shift (CLS = 0).
 * Reserves explicit dimensions matching standard Google AdSense responsive units.
 */
export const AdSlot: React.FC<AdSlotProps> = ({ variant, slotLabel = 'Advertisement' }) => {
  const adSettings = useContext(AdSettingsContext);
  if (!adSettings.enabled || !adSettings.clientId) return null;

  const dimensions =
    variant === 'leaderboard'
      ? 'min-h-[90px] w-full'
      : 'min-h-[250px] w-full';

  return (
    <aside
      aria-label={slotLabel}
      className={`${dimensions} flex flex-col items-center justify-center rounded-xl border border-hairline bg-sand/70 px-4 py-5 text-center`}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slatewarm/80">
        {slotLabel}
      </span>
      <span className="mt-1 text-xs text-slatewarm/70">
        {variant === 'leaderboard' ? '728 × 90 · Responsive Display Unit' : '300 × 250 · Responsive Unit'}
      </span>
    </aside>
  );
};
