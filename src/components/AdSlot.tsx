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
      className={`${dimensions} flex flex-col items-center justify-center rounded-lg border border-stone-200/90 bg-[#F3EFE6]/50 px-4 py-3 text-center`}
    >
      <span className="text-[11px] font-medium tracking-wide text-stone-400">
        {slotLabel}
      </span>
      <span className="mt-1 text-xs text-stone-400">
        {variant === 'leaderboard' ? '728 × 90 · Responsive Display Unit' : '300 × 250 · Responsive Unit'}
      </span>
    </aside>
  );
};
