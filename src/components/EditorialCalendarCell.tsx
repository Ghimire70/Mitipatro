import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { BS_MONTHS, WEEKDAYS } from '../../lib/bsData';
import type { CalendarCellData } from '../../lib/bsConverter';

interface EditorialCalendarCellProps {
  cell: CalendarCellData;
  bsYear: number;
  bsMonth: number;
  eventsOnDay: string[];
  hasPublicHoliday: boolean;
  isToday: boolean;
  isSelected: boolean;
  elementInfo?: {
    tithiName?: string;
    tithiIndex?: number;
    paksha?: 'shukla' | 'krishna';
    nakshatraName?: string;
  };
  onSelect: (bsDay: number) => void;
  holidayFocus?: boolean;
}

export const EditorialCalendarCell: React.FC<EditorialCalendarCellProps> = ({
  cell,
  bsYear,
  bsMonth,
  eventsOnDay,
  hasPublicHoliday,
  isToday,
  isSelected,
  elementInfo,
  onSelect,
  holidayFocus = false,
}) => {
  const { bsDay, bsDayNe, adDay, adMonthShort, weekday, isSaturday } = cell;
  const isFirstOfBsMonth = bsDay === 1;
  const isFirstOfAdMonth = adDay === 1;
  const showAdLabel = isFirstOfBsMonth || isFirstOfAdMonth;

  const weekdayMeta = WEEKDAYS[weekday];
  const isDimmed = holidayFocus && !hasPublicHoliday && !isSaturday;

  return (
    <button
      type="button"
      role="gridcell"
      aria-selected={isSelected}
      aria-label={
        [
          `${BS_MONTHS[bsMonth - 1].en} ${bsDay}, ${bsYear} BS`,
          `${adMonthShort} ${adDay}, ${cell.adYear}`,
          weekdayMeta.en,
          isToday ? 'Today' : '',
          eventsOnDay.length > 0 ? `Holiday: ${eventsOnDay.join(', ')}` : '',
        ].filter(Boolean).join(', ')
      }
      onClick={() => onSelect(bsDay)}
      className={`group relative flex flex-col justify-between p-2 sm:p-3 transition-colors duration-150 sm:min-h-[140px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
        isToday
          ? 'bg-terracotta-soft ring-2 ring-inset ring-terracotta'
          : isSelected
            ? 'bg-sand/85 ring-2 ring-inset ring-ink/75'
            : isSaturday
              ? 'bg-stone-50/60 hover:bg-stone-100'
              : 'bg-white hover:bg-stone-50/60'
      }} ${isDimmed ? 'opacity-35' : 'opacity-100'}`}
    >
      {/* Cell header: BS numeral + Devanagari numeral */}
      <div className="flex items-start justify-between gap-1 mb-1">
        <span
          className={`font-mono text-lg font-bold leading-none tabular-nums sm:text-xl ${
            isToday || isSaturday || hasPublicHoliday
              ? 'text-terracotta'
              : 'text-ink'
          }`}
        >
          {bsDay}
        </span>
        <span className="text-[10px] font-bold leading-none text-stone-400 tabular-nums sm:text-xs">
          {bsDayNe}
        </span>
      </div>

      {/* Today badge */}
      {isToday && (
        <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-terracotta text-[10px] font-bold text-white shadow-xs ring-1 ring-inset ring-white pulse-today">
          <CalendarIcon className="h-3 w-3" aria-hidden="true" />
          आज
        </span>
      )}

      {/* Holiday / festival labels — zero truncation, clean multi-line wrap */}
      <div className="mt-1 flex w-full flex-col gap-0.5 text-[10px] leading-tight">
        {eventsOnDay.map((eventName, idx) => (
          <span
            key={idx}
            className={`font-medium ${
              hasPublicHoliday ? 'text-terracotta' : 'text-stone-600'
            }`}
            title={eventName}
          >
            {eventName}
          </span>
        ))}
        {eventsOnDay.length === 0 && isSaturday && (
          <span className="text-stone-400 italic">Weekly rest</span>
        )}
      </div>

      {/* Tithi info (panchanga) */}
      {elementInfo?.tithiName && (
        <span
          className="mt-0.5 text-[9px] leading-tight text-stone-600"
          title={`Tithi: ${elementInfo.tithiName} ${elementInfo.paksha}`}
        >
          {elementInfo.tithiName}
        </span>
      )}

      {/* AD date at bottom right */}
      <div className="mt-auto flex w-full items-end justify-between pt-1">
        <span
          className={`font-mono text-[10px] tabular-nums sm:text-[11px] ${
            showAdLabel ? 'text-stone-500' : 'text-stone-400/60'
          }`}
        >
          {showAdLabel ? `${adMonthShort} ${adDay}` : adDay}
        </span>
      </div>

      {/* Hover panchanga tooltip */}
      {elementInfo && (
        <div className="cell-tooltip absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-2.5 rounded-xl bg-ink text-white text-[11px] shadow-float hidden sm:block">
          <div className="font-serif font-bold text-xs text-white">
            {BS_MONTHS[bsMonth - 1].en} {bsDay}, {bsYear} BS
          </div>
          <div className="text-white/75 mt-0.5">
            {adMonthShort} {adDay}, {cell.adYear} · {weekdayMeta.en}
          </div>
          <div className="text-terracotta-border font-medium mt-1 pt-1 border-t border-white/15">
            Tithi: {elementInfo.tithiName}{' '}
            {elementInfo.paksha ? `(${elementInfo.paksha})` : ''}
          </div>
          {elementInfo.nakshatraName && (
            <div className="mt-0.5 text-white/75 text-[10px]">
              Nakshatra: {elementInfo.nakshatraName}
            </div>
          )}
        </div>
      )}
    </button>
  );
};
