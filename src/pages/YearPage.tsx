import React, { useMemo } from 'react';
import { BS_MONTHS, PUBLISHED_BS_YEARS } from '../../lib/bsData';
import {
  bsToAd,
  getBsMonthGrid,
  getTodayNepal,
  getTotalDaysInBsYear,
  toDevanagariDigits,
} from '../../lib/bsConverter';
import { getHolidaysForMonth, getHolidaysForYear } from '../../lib/holidays';
import type { FaqItem } from '../../lib/seo';
import { AdSlot } from '../components/AdSlot';
import { FaqSection } from '../components/FaqSection';
import { HolidayReferenceNote } from '../components/HolidayReferenceNote';

interface YearPageProps {
  year: number;
  faqs: FaqItem[];
  nowMs?: number;
  onNavigate: (path: string) => void;
}

export const YearPage: React.FC<YearPageProps> = ({ year, faqs, nowMs, onNavigate }) => {
  const today = useMemo(() => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined), [nowMs]);
  const totalDays = useMemo(() => getTotalDaysInBsYear(year), [year]);
  const startAd = useMemo(() => bsToAd(year, 1, 1), [year]);
  const endMonthDays = useMemo(() => getBsMonthGrid(year, 12).totalDays, [year]);
  const endAd = useMemo(() => bsToAd(year, 12, endMonthDays), [year, endMonthDays]);
  const yearHolidays = useMemo(() => getHolidaysForYear(year), [year]);
  const publicHolidayCount = yearHolidays.filter((h) => h.isPublicHoliday).length;

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
        <a href="/" onClick={(e) => handleLink(e, '/')} className="hover:text-[#9A3412] hover:underline">
          Home
        </a>
        <span className="mx-2">/</span>
        <span className="text-stone-800">Nepali Calendar {year} BS</span>
      </nav>

      <div className="mt-4 flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Nepali Calendar {year} BS Overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
            Bikram Sambat {year} ({toDevanagariDigits(year)}) spans {totalDays} days from{' '}
            {startAd.formattedEn} to {endAd.formattedEn}, with {publicHolidayCount} entries marked as public holidays. Select any month below to inspect daily BS–AD dates and festivals.
          </p>
          <div className="mt-3">
            <HolidayReferenceNote />
          </div>
        </div>

        {/* Year Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {PUBLISHED_BS_YEARS.map((yr) => (
            <a
              key={yr}
              href={`/calendar/${yr}`}
              onClick={(e) => handleLink(e, `/calendar/${yr}`)}
              aria-current={yr === year ? 'page' : undefined}
              className={`inline-flex min-h-[40px] items-center rounded-md border px-3.5 py-1.5 font-mono text-xs font-semibold tabular-nums transition-colors ${
                yr === year
                  ? 'border-[#9A3412] bg-[#9A3412] text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              {yr} BS
            </a>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <AdSlot variant="leaderboard" />
      </div>

      {/* 12-Month Grid */}
      <section aria-label={`${year} BS 12 Months`} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BS_MONTHS.map((m) => {
          const grid = getBsMonthGrid(year, m.index);
          const mHolidays = getHolidaysForMonth(year, m.index);
          const isCurrentMonth = today.bs.year === year && today.bs.month === m.index;

          return (
            <a
              key={m.slug}
              href={`/calendar/${year}/${m.slug}`}
              onClick={(e) => handleLink(e, `/calendar/${year}/${m.slug}`)}
              className={`group flex flex-col justify-between rounded-xl border p-5 transition-colors ${
                isCurrentMonth
                  ? 'border-[#9A3412] bg-[#9A3412]/5'
                  : 'border-stone-200 bg-white hover:border-[#9A3412]'
              }`}
            >
              <div>
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-xl font-semibold text-stone-900 group-hover:text-[#9A3412]">
                    {m.index}. {m.en}
                  </h2>
                  <span className="font-display text-lg text-stone-600">{m.ne}</span>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {grid.adSpanLabel} · {grid.totalDays} days
                </p>
              </div>

              <div className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-600">
                {mHolidays.length > 0 ? (
                  <p className="truncate">
                    <span className="font-semibold text-[#9A3412]">{mHolidays.length} events:</span>{' '}
                    {mHolidays.map((h) => h.nameEn).join(', ')}
                  </p>
                ) : (
                  <p className="text-stone-400">Open full monthly grid →</p>
                )}
              </div>
            </a>
          );
        })}
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
        <a
          href={`/holidays/${year}`}
          onClick={(e) => handleLink(e, `/holidays/${year}`)}
          className="font-semibold text-[#9A3412] hover:underline"
        >
          View all Public Holidays in {year} BS →
        </a>
        <span className="text-stone-300">|</span>
        <a
          href="/date-converter"
          onClick={(e) => handleLink(e, '/date-converter')}
          className="font-semibold text-stone-700 hover:text-[#9A3412] hover:underline"
        >
          Convert {year} BS dates to AD →
        </a>
      </div>

      <FaqSection faqs={faqs} />
    </div>
  );
};
