import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { getTodayNepal, bsToAd, toDevanagariDigits } from '../../lib/bsConverter';
import { BS_MONTHS } from '../../lib/bsData';

interface EditorialHeroProps {
  bsYear: number;
  bsMonth: number;
  nowMs?: number;
  onJumpToToday: () => void;
  onOpenHolidays: () => void;
  monthSlug: string;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  bsYear,
  bsMonth,
  nowMs,
  onJumpToToday,
  onOpenHolidays,
  monthSlug,
}) => {
  const [nepalTime, setNepalTime] = useState<string>('');
  const today = getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined);
  const isCurrent = today.bs.year === bsYear && today.bs.month === bsMonth;
  const refDay = isCurrent ? today.bs.day : 1;
  const refWeekday = isCurrent
    ? today.weekday.en
    : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][
        new Date(Date.UTC(bsToAd(bsYear, bsMonth, refDay).year, bsToAd(bsYear, bsMonth, refDay).month - 1, bsToAd(bsYear, bsMonth, refDay).day)).getUTCDay()
      ];

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kathmandu',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(now);
      const h = parts.find((p) => p.type === 'hour')!.value;
      const m = parts.find((p) => p.type === 'minute')!.value;
      const s = parts.find((p) => p.type === 'second')!.value;
      setNepalTime(`${h}:${m}:${s} NPT`);
    };
    updateClock();
    const id = setInterval(updateClock, 1000);
    id.unref?.();
    return () => clearInterval(id);
  }, []);

  const monthMeta = BS_MONTHS[bsMonth - 1];

  return (
    <header className="mb-6 border-b border-terracotta/20 bg-white/60 backdrop-blur-sm pb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-2 rounded-lg border border-terracotta/30 bg-terracotta/5 px-3 py-1">
            <span className="text-[10px] font-bold tracking-wider text-terracotta uppercase">
              AAJA KO MITI
            </span>
            <span className="text-[10px] font-semibold text-stone-400">
              ·
            </span>
            <span className="text-[10px] font-semibold text-slatewarm">
              ASIA/KATHMANDU (UTC+05:45)
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {monthMeta.en} {bsYear} Nepali Calendar<span className="text-terracotta"> ({monthMeta.ne})</span>
          </h1>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row items-end">
          <div className="flex items-center gap-3 text-right">
            <div className="flex flex-col items-end">
              <p className="text-xs font-semibold text-slatewarm">
                Bikram Sambat
              </p>
              <p className="font-display text-2xl font-bold text-ink">
                {monthMeta.en} {toDevanagariDigits(refDay)},{' '}
                {toDevanagariDigits(bsYear)}
              </p>
              <p className="text-sm font-medium text-stone-600">
                {refWeekday} · {nepalTime}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onJumpToToday}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                isCurrent
                  ? 'bg-stone-900 text-white focus-visible:outline-stone-900'
                  : 'bg-terracotta text-white focus-visible:outline-terracotta'
              } hover:${
                isCurrent ? 'bg-stone-800' : 'bg-terracotta-hover'
              }`}
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              {isCurrent ? 'Already Today' : 'Jump to Today'}
            </button>
            <button
              type="button"
              onClick={onOpenHolidays}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-stone-200 bg-white px-5 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              <Sparkles className="h-4 w-4 text-terracotta" aria-hidden="true" />
              2083 Public Holidays
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
