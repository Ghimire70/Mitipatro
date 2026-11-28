import React, { useCallback, useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarCheck, Copy } from 'lucide-react';
import {
  BS_MAX_YEAR,
  BS_MIN_YEAR,
  BS_MONTHS,
  BS_MONTH_DAYS,
} from '../../lib/bsData';
import {
  adToBs,
  bsToAd,
  getTodayNepal,
  toDevanagariDigits,
  validateAdDate,
  validateBsDate,
} from '../../lib/bsConverter';
import { CalendarCellData } from '../../lib/bsConverter';
import { useLocale } from '../../contexts/LocaleContext';
import { formatLocaleNumber } from '../../lib/i18n/format';

interface QuickConverterPanelProps {
  nowMs?: number;
  onNavigate?: (path: string) => void;
}

interface ConversionResult {
  ok: boolean;
  error?: string;
  ad?: {
    year: number;
    month: number;
    day: number;
    monthNameEn: string;
    weekdayEn: string;
    iso: string;
  };
  bs?: {
    year: number;
    month: number;
    day: number;
    monthNameEn: string;
    monthSlug: string;
    weekdayEn: string;
    iso: string;
  };
}

export const QuickConverterPanel: React.FC<QuickConverterPanelProps> = ({
  nowMs,
  onNavigate,
}) => {
  const today = useMemo(() => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined), [nowMs]);
  const { locale } = useLocale();

  const [mode, setMode] = useState<'bs-to-ad' | 'ad-to-bs'>('bs-to-ad');

  const [bsYear, setBsYear] = useState<string>(String(today.bs.year));
  const [bsMonth, setBsMonth] = useState<string>(String(today.bs.month));
  const [bsDay, setBsDay] = useState<string>(String(today.bs.day));

  const [adYear, setAdYear] = useState<string>(String(today.ad.year));
  const [adMonth, setAdMonth] = useState<string>(String(today.ad.month));
  const [adDay, setAdDay] = useState<string>(String(today.ad.day));

  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const bsYearsList = useMemo(() => {
    const arr: number[] = [];
    for (let y = BS_MIN_YEAR; y <= BS_MAX_YEAR; y++) arr.push(y);
    return arr;
  }, []);

  const bsResult = useMemo<ConversionResult>(() => {
    const y = Number(bsYear);
    const m = Number(bsMonth);
    const d = Number(bsDay);
    const check = validateBsDate(y, m, d);
    if (!check.valid) {
      return { ok: false, error: check.error ?? 'Invalid BS date.' };
    }
    const ad = bsToAd(y, m, d);
    const bs = adToBs(ad.iso);
    return {
      ok: true,
      ad: {
        year: ad.year,
        month: ad.month,
        day: ad.day,
        monthNameEn: ad.monthNameEn,
        weekdayEn: ad.weekdayEn,
        iso: ad.iso,
      },
      bs: {
        year: bs.year,
        month: bs.month,
        day: bs.day,
        monthNameEn: bs.monthNameEn,
        monthSlug: bs.monthSlug,
        weekdayEn: bs.weekdayEn,
        iso: bs.iso,
      },
    };
  }, [bsYear, bsMonth, bsDay]);

  const adResult = useMemo<ConversionResult>(() => {
    const y = Number(adYear);
    const m = Number(adMonth);
    const d = Number(adDay);
    const check = validateAdDate(y, m, d);
    if (!check.valid) {
      return { ok: false, error: check.error ?? 'Invalid Gregorian date.' };
    }
    const bs = adToBs({ year: y, month: m, day: d });
    const ad = bsToAd(bs.year, bs.month, bs.day);
    return {
      ok: true,
      bs: {
        year: bs.year,
        month: bs.month,
        day: bs.day,
        monthNameEn: bs.monthNameEn,
        monthSlug: bs.monthSlug,
        weekdayEn: bs.weekdayEn,
        iso: bs.iso,
      },
      ad: {
        year: ad.year,
        month: ad.month,
        day: ad.day,
        monthNameEn: ad.monthNameEn,
        weekdayEn: ad.weekdayEn,
        iso: ad.iso,
      },
    };
  }, [adYear, adMonth, adDay]);

  const resetToToday = useCallback(() => {
    const t = getTodayNepal();
    setBsYear(String(t.bs.year));
    setBsMonth(String(t.bs.month));
    setBsDay(String(t.bs.day));
    setAdYear(String(t.ad.year));
    setAdMonth(String(t.ad.month));
    setAdDay(String(t.ad.day));
    setCopyStatus('idle');
  }, []);

  const selectedMonthMaxDays = useMemo(() => {
    const y = Number(bsYear);
    const m = Number(bsMonth);
    if (BS_MONTH_DAYS[y] && m >= 1 && m <= 12) {
      return BS_MONTH_DAYS[y][m - 1];
    }
    return 32;
  }, [bsYear, bsMonth]);

  const activeResult = mode === 'bs-to-ad' ? bsResult : adResult;

  const relativeBadge = useMemo(() => {
    if (!activeResult.ok) return null;
    const resultBsDay = mode === 'bs-to-ad' ? Number(bsDay) : activeResult.bs?.day;
    const resultBsMonth = mode === 'bs-to-ad' ? Number(bsMonth) : activeResult.bs?.month;
    const resultBsYear = mode === 'bs-to-ad' ? Number(bsYear) : activeResult.bs?.year;
    if (
      resultBsYear === today.bs.year &&
      resultBsMonth === today.bs.month &&
      resultBsDay === today.bs.day
    ) {
      return 'Today in Nepal';
    }
    return null;
  }, [activeResult.ok, mode, bsYear, bsMonth, bsDay, activeResult.bs, today.bs]);

  const primaryLabel = useMemo(() => {
    if (!activeResult.ok) return '';
    if (mode === 'bs-to-ad') {
      return locale === 'ne'
        ? `${activeResult.ad!.weekdayEn}, ${formatLocaleNumber(activeResult.ad!.day, locale)} ${activeResult.ad!.monthNameEn}, ${formatLocaleNumber(activeResult.ad!.year, locale)}`
        : `${activeResult.ad!.weekdayEn}, ${activeResult.ad!.monthNameEn} ${activeResult.ad!.day}, ${activeResult.ad!.year}`;
    }
    return locale === 'ne'
      ? `${activeResult.bs!.monthNameEn} ${formatLocaleNumber(activeResult.bs!.day, locale)}, ${formatLocaleNumber(activeResult.bs!.year, locale)} (${activeResult.bs!.weekdayEn})`
      : `${activeResult.bs!.monthNameEn} ${activeResult.bs!.day}, ${activeResult.bs!.year} (${activeResult.bs!.weekdayEn})`;
  }, [activeResult.ok, mode, activeResult.ad, activeResult.bs]);

  const secondaryLabel = useMemo(() => {
    if (!activeResult.ok) return '';
    if (mode === 'bs-to-ad') {
      return locale === 'ne'
        ? `${activeResult.bs!.monthNameEn} ${toDevanagariDigits(activeResult.bs!.day)}, ${toDevanagariDigits(activeResult.bs!.year)} · ${activeResult.bs!.iso}`
        : `${activeResult.bs!.monthNameEn} ${activeResult.bs!.day}, ${activeResult.bs!.year} · ${activeResult.bs!.iso}`;
    }
    return locale === 'ne'
      ? `${activeResult.ad!.monthNameEn} ${formatLocaleNumber(activeResult.ad!.day, locale)}, ${formatLocaleNumber(activeResult.ad!.year, locale)} · ${activeResult.ad!.iso}`
      : `${activeResult.ad!.monthNameEn} ${activeResult.ad!.day}, ${activeResult.ad!.year} · ${activeResult.ad!.iso}`;
  }, [activeResult.ok, mode, activeResult.ad, activeResult.bs]);

  const handleCopy = useCallback(() => {
    const text = mode === 'bs-to-ad'
      ? `${primaryLabel.split(', ')[0]}, ${primaryLabel.split(', ').slice(1).join(', ')}`
      : primaryLabel;
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 1500);
    });
  }, [mode, primaryLabel]);

  return (
    <section
      aria-label="BS to AD Date Converter"
      className="rounded-xl border border-hairline bg-card shadow-editorial p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-hairline pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Mode segmented toggle */}
        <div
          role="tablist"
          aria-label="Conversion direction"
          className="inline-flex rounded-xl bg-sand border border-hairline/70 p-1 shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'bs-to-ad'}
            onClick={() => setMode('bs-to-ad')}
            className={`min-h-[44px] rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
              mode === 'bs-to-ad'
                ? 'bg-card text-ink shadow-xs'
                : 'text-slatewarm hover:text-ink'
            }`}
          >
            {locale === 'ne' ? 'वि.सं.–ई.सं.' : 'BS to AD'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'ad-to-bs'}
            onClick={() => setMode('ad-to-bs')}
            className={`min-h-[44px] rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
              mode === 'ad-to-bs'
                ? 'bg-card text-ink shadow-xs'
                : 'text-slatewarm hover:text-ink'
            }`}
          >
            {locale === 'ne' ? 'ई.सं.–वि.सं.' : 'AD to BS'}
          </button>
        </div>

        {/* Today reset button */}
        <button
          type="button"
          onClick={resetToToday}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-hairline bg-paper px-3 py-2 text-xs sm:text-sm font-medium text-stone-700 hover:bg-sand whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          <CalendarCheck className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" />
          <span>{locale === 'ne' ? 'आज रीसेट गर्नुहोस्' : 'Reset Today'}</span>
        </button>
      </div>

      {/* Form inputs — 3-col grid */}
      <div className={`mt-6 grid gap-2.5 ${mode === 'bs-to-ad' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 lg:grid-cols-12'}`}>
        {/* Year */}
        <div className="col-span-1 lg:col-span-4">
          <label htmlFor={`conv-${mode}-year`} className="block text-[11px] font-medium text-slatewarm mb-1.5">
            {locale === 'ne'
              ? mode === 'bs-to-ad'
                ? 'वि.सं. वर्ष'
                : 'ई.सं. वर्ष'
              : mode === 'bs-to-ad'
                ? 'BS Year'
                : 'AD Year'}
          </label>
          {mode === 'bs-to-ad' ? (
            <select
              id="conv-bs-year"
              value={bsYear}
              onChange={(e) => setBsYear(e.target.value)}
              className="editorial-select w-full h-10 px-2.5 text-sm font-medium text-ink bg-card border border-hairline rounded-xl focus:outline-none focus:border-terracotta transition-colors"
            >
              {bsYearsList.map((y) => (
                <option key={y} value={y}>
                  {y} ({toDevanagariDigits(y)})
                </option>
              ))}
            </select>
          ) : (
            <input
              id="conv-ad-year"
              type="number"
              min={1943}
              max={2034}
              value={adYear}
              onChange={(e) => setAdYear(e.target.value)}
              className="w-full h-10 px-2.5 text-sm font-medium text-ink text-center bg-card border border-hairline rounded-xl focus:outline-none focus:border-terracotta transition-colors"
            />
          )}
        </div>

        {/* Month */}
        <div className="col-span-1 lg:col-span-5">
          <label htmlFor={`conv-${mode}-month`} className="block text-[11px] font-medium text-slatewarm mb-1.5">
            {locale === 'ne' ? 'महिना' : 'Month'}
          </label>
          {mode === 'bs-to-ad' ? (
            <select
              id="conv-bs-month"
              value={bsMonth}
              onChange={(e) => setBsMonth(e.target.value)}
              className="editorial-select w-full h-10 px-2.5 text-sm font-medium text-ink bg-card border border-hairline rounded-xl focus:outline-none focus:border-terracotta transition-colors"
            >
              {BS_MONTHS.map((m) => (
                <option key={m.index} value={m.index}>
                  {locale === 'ne' ? m.ne : m.en}
                </option>
              ))}
            </select>
          ) : (
            <select
              id="conv-ad-month"
              value={adMonth}
              onChange={(e) => setAdMonth(e.target.value)}
              className="editorial-select w-full h-10 px-2.5 text-sm font-medium text-ink bg-card border border-hairline rounded-xl focus:outline-none focus:border-terracotta transition-colors"
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December',
              ].map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Day */}
        <div className="col-span-1 lg:col-span-3">
          <label htmlFor={`conv-${mode}-day`} className="block text-[11px] font-medium text-slatewarm mb-1.5">
            {locale === 'ne' ? 'तिथि' : 'Day'}
          </label>
          <input
            id={`conv-${mode}-day`}
            type="number"
            min={1}
            max={mode === 'bs-to-ad' ? selectedMonthMaxDays : 31}
            value={mode === 'bs-to-ad' ? bsDay : adDay}
            onChange={(e) =>
              mode === 'bs-to-ad' ? setBsDay(e.target.value) : setAdDay(e.target.value)
            }
            className="w-full h-10 px-2.5 text-sm font-medium text-ink text-center bg-card border border-hairline rounded-xl focus:outline-none focus:border-terracotta transition-colors"
          />
        </div>
      </div>

      {/* Centered swap control */}
      <div className="relative flex items-center justify-center py-2">
        <div className="w-full border-t border-hairline" />
        <button
          type="button"
          onClick={() => setMode(mode === 'bs-to-ad' ? 'ad-to-bs' : 'bs-to-ad')}
          className="absolute inline-flex items-center justify-center w-9 h-9 rounded-full bg-card border border-hairline text-ink hover:text-terracotta hover:border-terracotta-border shadow-xs transition-all active:rotate-180"
          aria-label="Swap conversion direction"
        >
          <ArrowLeftRight className="w-4 h-4 text-terracotta" aria-hidden="true" />
        </button>
      </div>

      {/* Output or validation error */}
      <div className="mt-6 border-t border-hairline pt-5" aria-live="polite">
        {!activeResult.ok ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
          >
            <span className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3" />
              </svg>
            </span>
            <span>{activeResult.error}</span>
          </div>
        ) : (
          <div className="rounded-xl bg-paper border border-hairline p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slatewarm">
                    {mode === 'bs-to-ad'
                      ? 'GREGORIAN (AD) EQUIVALENT'
                      : 'BIKRAM SAMBAT (BS) EQUIVALENT'}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slatewarm hover:text-ink bg-card border border-hairline rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[8px]`}
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{copyStatus === 'copied' ? (locale === 'ne' ? 'कपी भयो!' : 'Copied!') : (locale === 'ne' ? 'कपी गर्नुहोस्' : 'Copy')}</span>
                  </button>
                </div>
                <p className="mt-1 font-serif font-bold text-2xl sm:text-[1.65rem] leading-[1.2] text-ink whitespace-normal break-words">
                  {primaryLabel}
                </p>
                <p className="mt-2 text-xs text-slatewarm font-devanagari">
                  {secondaryLabel}
                </p>
                {relativeBadge && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-terracotta-soft px-3 py-1 text-[10px] font-bold text-terracotta">
                    {relativeBadge}
                  </p>
                )}
              </div>

              <div className="mt-4 border-t border-hairline/80 pt-2 flex items-center justify-between text-[11px] text-slatewarm">
                <span id="conv-relative-badge">{relativeBadge || ''}</span>
                {onNavigate && activeResult.bs && activeResult.bs.year >= 2082 && activeResult.bs.year <= 2085 && (
                  <a
                    href={`/calendar/${activeResult.bs.year}/${activeResult.bs.monthSlug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/calendar/${activeResult.bs!.year}/${activeResult.bs!.monthSlug}`);
                    }}
                    className="font-semibold text-terracotta hover:underline"
                  >
                    {locale === 'ne' ? `${activeResult.bs!.monthNameEn} ${formatLocaleNumber(activeResult.bs!.year, locale)} वि.सं. हेर्नुहोस् →` : `View ${activeResult.bs!.monthNameEn} ${formatLocaleNumber(activeResult.bs!.year, locale)} →`}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
