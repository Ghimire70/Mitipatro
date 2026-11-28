import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, AlertCircle, CalendarCheck } from 'lucide-react';
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
import { useLocale } from '../../contexts/LocaleContext';
import { formatLocaleNumber } from '../../lib/i18n/format';

interface DateConverterProps {
  compact?: boolean;
  nowMs?: number;
  onNavigate?: (path: string) => void;
}

export const DateConverter: React.FC<DateConverterProps> = ({
  compact = false,
  nowMs,
  onNavigate,
}) => {
  const today = useMemo(() => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined), [nowMs]);
  const { locale } = useLocale();
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

  const bsResult = useMemo(() => {
    const y = Number(bsYear);
    const m = Number(bsMonth);
    const d = Number(bsDay);
    const check = validateBsDate(y, m, d);
    if (!check.valid) {
      return { ok: false as const, error: check.error ?? 'Invalid BS date.' };
    }
    const ad = bsToAd(y, m, d);
    const bs = adToBs(ad.iso);
    return { ok: true as const, ad, bs };
  }, [bsYear, bsMonth, bsDay]);

  const adResult = useMemo(() => {
    const y = Number(adYear);
    const m = Number(adMonth);
    const d = Number(adDay);
    const check = validateAdDate(y, m, d);
    if (!check.valid) {
      return { ok: false as const, error: check.error ?? 'Invalid Gregorian date.' };
    }
    const bs = adToBs({ year: y, month: m, day: d });
    const ad = bsToAd(bs.year, bs.month, bs.day);
    return { ok: true as const, bs, ad };
  }, [adYear, adMonth, adDay]);

  const resetToToday = () => {
    const t = getTodayNepal();
    setBsYear(String(t.bs.year));
    setBsMonth(String(t.bs.month));
    setBsDay(String(t.bs.day));
    setAdYear(String(t.ad.year));
    setAdMonth(String(t.ad.month));
    setAdDay(String(t.ad.day));
  };

  const handleModeSwitch = (nextMode: 'bs-to-ad' | 'ad-to-bs') => {
    if (nextMode === 'ad-to-bs' && bsResult.ok) {
      setAdYear(String(bsResult.ad.year));
      setAdMonth(String(bsResult.ad.month));
      setAdDay(String(bsResult.ad.day));
    } else if (nextMode === 'bs-to-ad' && adResult.ok) {
      setBsYear(String(adResult.bs.year));
      setBsMonth(String(adResult.bs.month));
      setBsDay(String(adResult.bs.day));
    }
    setMode(nextMode);
  };

  const selectedMonthMaxDays = useMemo(() => {
    const y = Number(bsYear);
    const m = Number(bsMonth);
    if (BS_MONTH_DAYS[y] && m >= 1 && m <= 12) {
      return BS_MONTH_DAYS[y][m - 1];
    }
    return 32;
  }, [bsYear, bsMonth]);

  const activeResult = mode === 'bs-to-ad' ? bsResult : adResult;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Mode Segmented Tabs */}
        <div
          role="tablist"
          aria-label="Conversion direction"
          className="inline-flex rounded-lg bg-[#F3EFE6] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'bs-to-ad'}
            onClick={() => handleModeSwitch('bs-to-ad')}
            className={`min-h-[40px] rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#9A3412] ${
              mode === 'bs-to-ad'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {locale === 'ne' ? 'वि.सं.–ई.सं.' : 'BS to AD'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'ad-to-bs'}
            onClick={() => handleModeSwitch('ad-to-bs')}
            className={`min-h-[40px] rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#9A3412] ${
              mode === 'ad-to-bs'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {locale === 'ne' ? 'ई.सं.–वि.सं.' : 'AD to BS'}
          </button>
        </div>

        <button
          type="button"
          onClick={resetToToday}
          className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-md border border-stone-200 bg-[#FBF9F5] px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#9A3412] sm:self-auto"
        >
          <CalendarCheck className="h-3.5 w-3.5 text-[#9A3412]" aria-hidden="true" />
          <span>{locale === 'ne' ? 'आज (नेपाल समय)' : compact ? 'Today (NPT)' : 'Today (Nepal Time)'}</span>
        </button>
      </div>

      {/* Form Inputs */}
      {mode === 'bs-to-ad' ? (
        <div className={`mt-5 grid gap-3.5 ${compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
          <div>
            <label htmlFor="conv-bs-year" className="block text-xs font-medium text-stone-600">
              {locale === 'ne' ? 'वि.सं. वर्ष (२०००–२०९०)' : 'BS Year (2000–2090)'}
            </label>
            <select
              id="conv-bs-year"
              value={bsYear}
              onChange={(e) => setBsYear(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-2.5 font-mono text-sm text-stone-900 focus:border-[#9A3412] focus:outline-none"
            >
              {bsYearsList.map((y) => (
                <option key={y} value={y}>
                  {y} ({toDevanagariDigits(y)})
                </option>
              ))}
            </select>
          </div>

          <div className={compact ? 'col-span-2 order-first' : ''}>
            <label htmlFor="conv-bs-month" className="block text-xs font-medium text-stone-600">
              {locale === 'ne' ? 'वि.सं. महिना' : 'BS Month'}
            </label>
            <select
              id="conv-bs-month"
              value={bsMonth}
              onChange={(e) => setBsMonth(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-2.5 text-sm text-stone-900 focus:border-[#9A3412] focus:outline-none"
            >
              {BS_MONTHS.map((m) => (
                <option key={m.index} value={m.index}>
                  {m.index}. {locale === 'ne' ? m.ne : m.en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="conv-bs-day" className="block text-xs font-medium text-stone-600">
              {locale === 'ne' ? `वि.सं. तिथि (1–${formatLocaleNumber(selectedMonthMaxDays, locale)})` : `BS Day (1–${formatLocaleNumber(selectedMonthMaxDays, locale)})`}
            </label>
            <input
              id="conv-bs-day"
              type="number"
              min={1}
              max={32}
              value={bsDay}
              onChange={(e) => setBsDay(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-3 font-mono text-sm text-stone-900 tabular-nums focus:border-[#9A3412] focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <div className={`mt-5 grid gap-3.5 ${compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
          <div>
            <label htmlFor="conv-ad-year" className="block text-xs font-medium text-stone-600">
              {locale === 'ne' ? 'ई.सं. वर्ष (१९४३–२०३४)' : 'AD Year (1943–2034)'}
            </label>
            <input
              id="conv-ad-year"
              type="number"
              min={1943}
              max={2034}
              value={adYear}
              onChange={(e) => setAdYear(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-3 font-mono text-sm text-stone-900 tabular-nums focus:border-[#9A3412] focus:outline-none"
            />
          </div>

          <div className={compact ? 'col-span-2 order-first' : ''}>
            <label htmlFor="conv-ad-month" className="block text-xs font-medium text-stone-600">
              {locale === 'ne' ? 'ई.सं. महिना' : 'AD Month'}
            </label>
            <select
              id="conv-ad-month"
              value={adMonth}
              onChange={(e) => setAdMonth(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-2.5 text-sm text-stone-900 focus:border-[#9A3412] focus:outline-none"
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December',
              ].map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {idx + 1}. {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="conv-ad-day" className="block text-xs font-medium text-stone-600">
              {locale === 'ne' ? `ई.सं. तिथि (1–${formatLocaleNumber(31, locale)})` : `AD Day (1–${formatLocaleNumber(31, locale)})`}
            </label>
            <input
              id="conv-ad-day"
              type="number"
              min={1}
              max={31}
              value={adDay}
              onChange={(e) => setAdDay(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-stone-300 bg-white px-3 font-mono text-sm text-stone-900 tabular-nums focus:border-[#9A3412] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Output or Validation Error */}
      <div className="mt-6 border-t border-stone-200 pt-5" aria-live="polite">
        {!activeResult.ok ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{activeResult.error}</span>
          </div>
        ) : (
          <div className="rounded-lg bg-[#FBF9F5] p-4 sm:p-5">
            <div className={`flex flex-col gap-4 ${compact ? '' : 'sm:flex-row sm:items-center sm:justify-between'}`}>
              <div>
                <p className="text-xs font-medium tracking-wide text-stone-500">
                  {locale === 'ne'
                    ? mode === 'bs-to-ad'
                      ? 'ग्रेगोरियन (ई.सं.) समकक्ष'
                      : 'बिक्रम सम्बत (वि.सं.) समकक्ष'
                    : mode === 'bs-to-ad'
                      ? 'Gregorian (AD) Equivalent'
                      : 'Bikram Sambat (BS) Equivalent'}
                </p>
                <p className="mt-1 font-display text-2xl font-semibold text-stone-900">
                  {mode === 'bs-to-ad'
                    ? `${activeResult.ad.weekdayEn}, ${activeResult.ad.formattedEn}`
                    : `${activeResult.bs.formattedEn} (${activeResult.bs.weekdayEn})`}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {activeResult.bs.formattedNe} · {activeResult.bs.weekdayNe} · ISO{' '}
                  <span className="font-mono text-xs tabular-nums">
                    {mode === 'bs-to-ad' ? activeResult.ad.iso : activeResult.bs.iso}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleModeSwitch(mode === 'bs-to-ad' ? 'ad-to-bs' : 'bs-to-ad')}
                className="inline-flex min-h-[40px] items-center gap-2 self-start rounded-md border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#9A3412]"
              >
                <ArrowLeftRight className="h-3.5 w-3.5 text-[#9A3412]" aria-hidden="true" />
                <span>{locale === 'ne' ? 'दिशा परिवर्तन गर्नुहोस्' : 'Swap Direction'}</span>
              </button>
            </div>

            {!compact && onNavigate && (
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-stone-200 pt-3 text-xs text-stone-600">
                <span>
                  {locale === 'ne' ? 'वि.सं. आइएसओ:' : 'BS ISO:'} <strong className="font-mono tabular-nums">{activeResult.bs.iso}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {locale === 'ne' ? 'ई.सं. आइएसओ:' : 'AD ISO:'} <strong className="font-mono tabular-nums">{activeResult.ad.iso}</strong>
                </span>
                <span aria-hidden="true">·</span>
                {activeResult.bs.year >= 2082 && activeResult.bs.year <= 2085 && (
                  <a
                    href={`/calendar/${activeResult.bs.year}/${activeResult.bs.monthSlug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/calendar/${activeResult.bs.year}/${activeResult.bs.monthSlug}`);
                    }}
                    className="font-semibold text-[#9A3412] hover:underline"
                  >
                    Open {activeResult.bs.monthNameEn} {activeResult.bs.year} Grid →
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
