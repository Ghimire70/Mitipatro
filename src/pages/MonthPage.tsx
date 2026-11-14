import React, { useMemo } from 'react';
import { bsToAd, getBsMonthGrid, toDevanagariDigits } from '../../lib/bsConverter';
import { WEEKDAYS } from '../../lib/bsData';
import { getHolidaysForMonth } from '../../lib/holidays';
import type { FaqItem } from '../../lib/seo';
import { CalendarGrid } from '../components/CalendarGrid';
import { AdSlot } from '../components/AdSlot';
import { FaqSection } from '../components/FaqSection';

interface MonthPageProps {
  year: number;
  month: number; // 1–12
  faqs: FaqItem[];
  nowMs?: number;
  onNavigate: (path: string) => void;
}

export const MonthPage: React.FC<MonthPageProps> = ({ year, month, faqs, nowMs, onNavigate }) => {
  const grid = useMemo(() => getBsMonthGrid(year, month), [year, month]);
  const firstAd = useMemo(() => bsToAd(year, month, 1), [year, month]);
  const lastAd = useMemo(() => bsToAd(year, month, grid.totalDays), [year, month, grid.totalDays]);
  const holidays = useMemo(() => getHolidaysForMonth(year, month), [year, month]);
  const publicCount = holidays.filter((h) => h.isPublicHoliday).length;

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
        <a
          href={`/calendar/${year}`}
          onClick={(e) => handleLink(e, `/calendar/${year}`)}
          className="hover:text-[#9A3412] hover:underline"
        >
          Calendar {year}
        </a>
        <span className="mx-2">/</span>
        <span className="text-stone-800">
          {grid.monthMeta.en} {year}
        </span>
      </nav>

      <header className="mt-4 border-b border-stone-200 pb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          {grid.monthMeta.en} {year} Nepali Calendar ({grid.monthMeta.ne} {toDevanagariDigits(year)})
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">
          {grid.monthMeta.en} {year} BS begins on {WEEKDAYS[grid.startWeekday].en},{' '}
          {firstAd.formattedEn}, and concludes on {lastAd.weekdayEn}, {lastAd.formattedEn}, spanning{' '}
          {grid.totalDays} days during {grid.monthMeta.seasonEn}.{' '}
          {publicCount > 0
            ? `This month includes ${publicCount} gazetted public holiday days${
                holidays.length > 0
                  ? `, including ${holidays.slice(0, 3).map((h) => h.nameEn).join(', ')}`
                  : ''
              }.`
            : 'Weekly Saturday holidays apply throughout this month.'}
        </p>
      </header>

      <div className="mt-6">
        <AdSlot variant="leaderboard" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CalendarGrid bsYear={year} bsMonth={month} nowMs={nowMs} onNavigate={onNavigate} />
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <h2 className="font-display text-lg font-semibold text-stone-900">
              Month Quick Facts
            </h2>
            <dl className="mt-4 divide-y divide-stone-100 text-sm">
              <div className="flex justify-between py-2.5">
                <dt className="text-stone-500">Total Days</dt>
                <dd className="font-mono font-semibold text-stone-900 tabular-nums">{grid.totalDays}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-stone-500">Starts (1 {grid.monthMeta.en})</dt>
                <dd className="font-mono text-stone-900 tabular-nums">{firstAd.iso}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-stone-500">Ends ({grid.totalDays} {grid.monthMeta.en})</dt>
                <dd className="font-mono text-stone-900 tabular-nums">{lastAd.iso}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-stone-500">First Weekday</dt>
                <dd className="text-stone-900">{firstAd.weekdayEn}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-stone-500">Season</dt>
                <dd className="text-stone-900">{grid.monthMeta.seasonEn}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-stone-500">Public Holidays</dt>
                <dd className="font-mono font-semibold text-[#9A3412] tabular-nums">{publicCount}</dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-col gap-2 border-t border-stone-200 pt-4 text-xs font-semibold">
              <a
                href={`/calendar/${year}`}
                onClick={(e) => handleLink(e, `/calendar/${year}`)}
                className="text-[#9A3412] hover:underline"
              >
                View all 12 months of {year} BS →
              </a>
              <a
                href={`/holidays/${year}`}
                onClick={(e) => handleLink(e, `/holidays/${year}`)}
                className="text-stone-700 hover:text-[#9A3412] hover:underline"
              >
                Public Holidays in {year} BS →
              </a>
              <a
                href="/date-converter"
                onClick={(e) => handleLink(e, '/date-converter')}
                className="text-stone-700 hover:text-[#9A3412] hover:underline"
              >
                BS to AD Date Converter →
              </a>
            </div>
          </div>

          <AdSlot variant="rectangle" />
        </aside>
      </div>

      <FaqSection faqs={faqs} />
    </div>
  );
};
