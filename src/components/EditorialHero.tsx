import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { getTodayNepal, bsToAd, toDevanagariDigits } from '../../lib/bsConverter';
import { BS_MONTHS } from '../../lib/bsData';
import { useLocale } from '../../contexts/LocaleContext';
import { formatLocaleYear, formatLocaleNumber } from '../../lib/i18n/format';

interface EditorialHeroProps {
  bsYear: number;
  bsMonth: number;
  nowMs?: number;
  onJumpToToday: () => void;
  onOpenHolidays: () => void;
  monthSlug: string;
  onNavigate: (path: string) => void;
  rashifalIndexingEnabled?: boolean;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  bsYear,
  bsMonth,
  nowMs,
  onJumpToToday,
  onOpenHolidays,
  onNavigate,
  monthSlug,
  rashifalIndexingEnabled = false,
}) => {
  const [nepalTime, setNepalTime] = useState<string>('');
  const today = getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined);
  const { locale } = useLocale();
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

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  const monthMeta = BS_MONTHS[bsMonth - 1];
  const refAdDate = bsToAd(bsYear, bsMonth, refDay);
  const gregorianDate = `${refAdDate.monthShortEn} ${refAdDate.day}, ${refAdDate.year}`;

  return (
    <header className="mb-6 border-b border-hairline bg-card/60 backdrop-blur-sm pb-6 sticky top-[56px] z-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-2 rounded-lg border border-terracotta/30 bg-terracotta/5 px-3 py-1">
            <span className="text-[10px] font-bold tracking-wider text-terracotta uppercase">
              {locale === 'ne' ? 'आजको मिति' : 'AAJA KO MITI'}
            </span>
            <span className="text-[10px] font-semibold text-stone-400">
              ·
            </span>
            <span className="text-[10px] font-semibold text-slatewarm">
              {locale === 'ne' ? 'एशिया/काठमाडौं (UTC+०५:४५)' : 'ASIA/KATHMANDU (UTC+05:45)'}
            </span>
          </div>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl leading-[1.08] tracking-tight text-ink">
            {locale === 'ne'
              ? `${monthMeta.ne} ${formatLocaleYear(bsYear, locale)} वि.सं. पात्रो`
              : `${monthMeta.en} ${formatLocaleYear(bsYear, locale)} Nepali Calendar`}
          </h1>
          <p className="text-base sm:text-lg text-ink/90 font-normal leading-relaxed">
            {locale === 'ne' ? 'आज हो' : 'Today is'}{' '}
            <span className="font-semibold text-terracotta whitespace-nowrap shrink-0">
              {locale === 'ne'
                ? `${monthMeta.ne} ${toDevanagariDigits(refDay)}, ${formatLocaleYear(bsYear, locale)} वि.सं.`
                : `${monthMeta.en} ${formatLocaleNumber(refDay, locale)}, ${formatLocaleYear(bsYear, locale)} BS`}
            </span>{' '}
            <span className="font-devanagari text-slatewarm whitespace-nowrap shrink-0">
              ({locale === 'ne' ? toDevanagariDigits(refDay) : formatLocaleNumber(refDay, locale)}, {formatLocaleYear(bsYear, locale)})
            </span>{' '}
            <span className="text-slatewarm mx-1">·</span>{' '}
            <span className="font-medium text-ink whitespace-nowrap shrink-0">
              {locale === 'ne' ? today.weekday.ne : refWeekday}
            </span>{' '}
            <span className="font-devanagari text-slatewarm whitespace-nowrap shrink-0">
              ({today.weekday.ne})
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row items-center gap-3 shrink-0 lg:w-56">
          <button
            type="button"
            onClick={onJumpToToday}
            className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white rounded-xl shadow-sm transition-all active:scale-[0.99] whitespace-nowrap shrink-0 min-h-[44px] ${
              isCurrent
                ? 'bg-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900'
                : 'bg-terracotta hover:bg-terracotta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta'
            }`}
          >
            <span>{locale === 'ne' ? 'आजमा जानुहोस्' : 'Jump to Today'}</span>
            <span aria-hidden="true" className="text-base leading-none">↓</span>
          </button>
          <button
            type="button"
            onClick={onOpenHolidays}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-ink bg-card hover:bg-sand border border-hairline rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            <Sparkles className="w-4 h-4 text-terracotta" aria-hidden="true" />
            <span>{locale === 'ne' ? `${formatLocaleYear(bsYear, locale)} वि.सं. सार्वजनिक बिदा` : `${formatLocaleYear(bsYear, locale)} Public Holidays`}</span>
          </button>
          {rashifalIndexingEnabled && (
            <a
              href="/rashifal"
              onClick={(e) => handleLink(e, '/rashifal')}
              className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-terracotta bg-card hover:bg-terracotta-soft border border-terracotta rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              <Sparkles className="w-4 h-4 text-terracotta" aria-hidden="true" />
              <span>दैनिक राशिफल</span>
            </a>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slatewarm">
        <svg className="w-4 h-4 text-slatewarm/80 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 14" />
        </svg>
        <span>{locale === 'ne' ? 'ग्रेगोरियन:' : 'Gregorian:'} <strong className="font-medium text-ink whitespace-nowrap shrink-0">{gregorianDate}</strong></span>
        <span aria-hidden="true">·</span>
        <span>{locale === 'ne' ? 'नेपाल समय:' : 'Nepal Time:'} <strong id="npt-clock" className="font-mono font-medium text-ink tabular-nums whitespace-nowrap shrink-0">{nepalTime}</strong></span>
      </div>
    </header>
  );
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
