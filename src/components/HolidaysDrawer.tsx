import React, { useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { BS_MONTHS, WEEKDAYS } from '../../lib/bsData';
import { adToBs, bsToAd, toDevanagariDigits } from '../../lib/bsConverter';
import { getHolidaysForYear } from '../../lib/holidays';

interface HolidaysDrawerProps {
  bsYear: number;
  bsMonth: number;
  open: boolean;
  onClose: () => void;
  onSelectDate: (bsYear: number, bsMonth: number, bsDay: number) => void;
}

export const HolidaysDrawer: React.FC<HolidaysDrawerProps> = ({
  bsYear,
  bsMonth,
  open,
  onClose,
  onSelectDate,
}) => {
  const holidays = useMemo(() => getHolidaysForYear(bsYear), [bsYear]);
  const monthHolidays = useMemo(
    () =>
      holidays.filter((h) => h.bsMonth === bsMonth && h.isPublicHoliday),
    [holidays, bsMonth],
  );

  const handleSelect = useCallback(
    (bsYear: number, bsMonth: number, bsDay: number) => {
      onClose();
      onSelectDate(bsYear, bsMonth, bsDay);
    },
    [onClose, onSelectDate],
  );

  if (!open) return null;

  const monthMeta = BS_MONTHS[bsMonth - 1];

  return (
    <div className="fixed inset-0 z-50 flex" aria-hidden="true">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white border-l border-stone-200 shadow-2xl transform transition-transform duration-300 translate-x-full sm:translate-x-0">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200">
          <h2 className="font-display text-lg font-bold text-ink">
            Public Holidays &mdash; {monthMeta.en} {bsYear} BS
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 focus:outline-2 focus:outline-offset-1 focus:outline-terracotta"
            aria-label="Close holidays drawer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-4">
          {monthHolidays.length === 0 ? (
            <p className="text-sm text-stone-500 text-center py-8">
              No public holidays listed for {monthMeta.en} {bsYear} BS.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {monthHolidays.map((h) => {
                const ad = bsToAd(h.bsYear, h.bsMonth, h.bsDay);
                const bsMonthMeta = BS_MONTHS[h.bsMonth - 1];
                return (
                  <li
                    key={h.id}
                    onClick={() =>
                      handleSelect(h.bsYear, h.bsMonth, h.bsDay)
                    }
                    className="group flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer hover:bg-stone-50 hover:border-terracotta/20 border border-transparent transition-colors"
                  >
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className="w-8 h-8 rounded-lg bg-terracotta-soft border border-terracotta-border text-terracotta flex flex-col items-center justify-center font-serif font-bold text-sm leading-none">
                        {h.bsDay}
                      </span>
                      <span className="text-[10px] font-semibold uppercase text-stone-400">
                        {bsMonthMeta.en.slice(0, 3)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif font-bold text-base text-ink group-hover:text-terracotta transition-colors">
                        {h.nameEn}
                      </h4>
                      <p className="text-xs text-stone-500">{h.nameNe}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-xs font-medium text-ink">
                        {AD_MONTHS_SHORT[ad.month - 1]} {ad.day}
                      </span>
                      <span className="block text-[11px] text-slatewarm">
                        {WEEKDAYS[ad.weekday].en.slice(0, 3)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50/50 text-center">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-tighter">
            Holiday dates are for reference. Confirm with official notices.
          </p>
        </div>
      </div>
    </div>
  );
};

const AD_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
