import React, { useCallback, useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarCheck } from 'lucide-react';
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

  const [mode, setMode] = useState<'bs-to-ad' | 'ad-to-bs'>('bs-to-ad');

  // BS inputs
  const [bsYear, setBsYear] = useState<string>(String(today.bs.year));
  const [bsMonth, setBsMonth] = useState<string>(String(today.bs.month));
  const [bsDay, setBsDay] = useState<string>(String(today.bs.day));

  // AD inputs
  const [adYear, setAdYear] = useState<string>(String(today.ad.year));
  const [adMonth, setAdMonth] = useState<string>(String(today.ad.month));
  const [adDay, setAdDay] = useState<string>(String(today.ad.day));

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

  return (
    <section
      aria-label="BS to AD Date Converter"
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Mode segmented toggle (separate from Today reset) */}
        <div
          role="tablist"
          aria-label="Conversion direction"
          className="inline-flex rounded-lg bg-[#F3EFE6] p-1 shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'bs-to-ad'}
            onClick={() => setMode('bs-to-ad')}
            className={`min-h-[40px] rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              mode === 'bs-to-ad'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            BS to AD
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'ad-to-bs'}
            onClick={() => setMode('ad-to-bs')}
            className={`min-h-[40px] rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              mode === 'ad-to-bs'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            AD to BS
          </button>
        </div>

        {/* Today reset button — separate action */}
        <button
          type="button"
          onClick={resetToToday}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-stone-200 bg-[#FBF9F5] px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        >
          <CalendarCheck className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" />
          <span>Today (NPT)</span>
        </button>
      </div>

      {/* Form inputs */}
      <div className={`mt-5 grid gap-3.5 ${mode === 'bs-to-ad' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {/* Year */}
        <div>
          <label htmlFor={`conv-${mode}-year`} className="block text-xs font-medium text-stone-600">
            {mode === 'bs-to-ad' ? 'BS Year (2000–2090)' : 'AD Year (1943–2034)'}
          </label>
          {mode === 'bs-to-ad' ? (
            <select
              id="conv-bs-year"
              value={bsYear}
              onChange={(e) => setBsYear(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-2.5 font-mono text-sm text-stone-900 focus:border-terracotta focus:outline-none"
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
              className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-3 font-mono text-sm text-stone-900 tabular-nums focus:border-terracotta focus:outline-none"
            />
          )}
        </div>

        {/* Month — full width dropdown, no clipping */}
        <div className="col-span-1 sm:col-span-1">
          <label htmlFor={`conv-${mode}-month`} className="block text-xs font-medium text-stone-600">
            Month
          </label>
          {mode === 'bs-to-ad' ? (
            <select
              id="conv-bs-month"
              value={bsMonth}
              onChange={(e) => setBsMonth(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-2.5 text-sm text-stone-900 focus:border-terracotta focus:outline-none"
            >
              {BS_MONTHS.map((m) => (
                <option key={m.index} value={m.index}>
                  {m.en} ({m.ne})
                </option>
              ))}
            </select>
          ) : (
            <select
              id="conv-ad-month"
              value={adMonth}
              onChange={(e) => setAdMonth(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-2.5 text-sm text-stone-900 focus:border-terracotta focus:outline-none"
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
        <div>
          <label htmlFor={`conv-${mode}-day`} className="block text-xs font-medium text-stone-600">
            {mode === 'bs-to-ad' ? `BS Day (1–${selectedMonthMaxDays})` : 'AD Day (1–31)'}
          </label>
          <input
            id={`conv-${mode}-day`}
            type="number"
            min={1}
            max={mode === 'bs-to-ad' ? 32 : 31}
            value={mode === 'bs-to-ad' ? bsDay : adDay}
            onChange={(e) =>
              mode === 'bs-to-ad' ? setBsDay(e.target.value) : setAdDay(e.target.value)
            }
            className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-3 font-mono text-sm text-stone-900 tabular-nums focus:border-terracotta focus:outline-none"
          />
        </div>
      </div>

      {/* Centered swap control between inputs and output */}
      <div className="mt-4 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setMode(mode === 'bs-to-ad' ? 'ad-to-bs' : 'bs-to-ad')}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900 focus:outline-2 focus:outline-offset-1 focus:outline-terracotta transition-colors"
          aria-label="Swap conversion direction"
        >
          <ArrowLeftRight className="h-5 w-5 text-terracotta" aria-hidden="true" />
        </button>
      </div>

      {/* Output or validation error */}
      <div className="mt-6 border-t border-stone-200 pt-5" aria-live="polite">
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
          <div className="rounded-lg bg-[#FBF9F5] p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                  {mode === 'bs-to-ad'
                    ? 'Gregorian (AD) Equivalent'
                    : 'Bikram Sambat (BS) Equivalent'}
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-ink">
                  {mode === 'bs-to-ad'
                    ? `${activeResult.ad!.weekdayEn}, ${activeResult.ad!.monthNameEn} ${activeResult.ad!.day}, ${activeResult.ad!.year}`
                    : `${activeResult.bs!.monthNameEn} ${activeResult.bs!.day}, ${activeResult.bs!.year} (${activeResult.bs!.weekdayEn})`}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {mode === 'bs-to-ad'
                    ? `BS: ${activeResult.bs!.monthNameEn} ${toDevanagariDigits(activeResult.bs!.day)}, ${toDevanagariDigits(activeResult.bs!.year)} · ${activeResult.bs!.iso}`
                    : `AD: ${activeResult.ad!.monthNameEn} ${activeResult.ad!.day}, ${activeResult.ad!.year} · ${activeResult.ad!.iso}`}
                </p>
                {relativeBadge && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-terracotta-soft px-3 py-1 text-[10px] font-bold text-terracotta">
                    {relativeBadge}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-3">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'bs-to-ad' ? 'ad-to-bs' : 'bs-to-ad')}
                  className="inline-flex min-h-[36px] items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-800 hover:bg-stone-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-terracotta"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" />
                  <span>Swap Direction</span>
                </button>

                {onNavigate && activeResult.bs && activeResult.bs.year >= 2082 && activeResult.bs.year <= 2085 && (
                  <a
                    href={`/calendar/${activeResult.bs.year}/${activeResult.bs.monthSlug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/calendar/${activeResult.bs!.year}/${activeResult.bs!.monthSlug}`);
                    }}
                    className="inline-flex min-h-[36px] items-center gap-2 rounded-md bg-terracotta px-3 py-1 text-xs font-semibold text-white hover:bg-terracotta-hover whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-terracotta"
                  >
                    <span>View {activeResult.bs!.monthNameEn} {activeResult.bs!.year} →</span>
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
