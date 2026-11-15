import React, { useMemo } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { BS_MONTHS, CURRENT_BS_YEAR, PUBLISHED_BS_YEARS } from '../../lib/bsData';
import { bsToAd, getTodayNepal, toDevanagariDigits } from '../../lib/bsConverter';
import { getHolidaysForYear } from '../../lib/holidays';
import type { FaqItem } from '../../lib/seo';
import { CalendarGrid } from '../components/CalendarGrid';
import { DateConverter } from '../components/DateConverter';
import { AdSlot } from '../components/AdSlot';
import { FaqSection } from '../components/FaqSection';
import { HolidayReferenceNote } from '../components/HolidayReferenceNote';
import { RasifalSection } from '../components/RasifalSection';

interface HomePageProps {
  faqs: FaqItem[];
  nowMs?: number;
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ faqs, nowMs, onNavigate }) => {
  const today = useMemo(() => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined), [nowMs]);
  const yearHolidays = useMemo(() => getHolidaysForYear(today.bs.year), [today.bs.year]);

  const upcomingHolidays = useMemo(() => {
    return yearHolidays
      .filter((h) => {
        if (h.bsMonth > today.bs.month) return true;
        if (h.bsMonth === today.bs.month && h.bsDay >= today.bs.day) return true;
        return false;
      })
      .slice(0, 6);
  }, [yearHolidays, today.bs.month, today.bs.day]);

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Banner: Today's BS Date in Nepal Time */}
      <section aria-labelledby="hero-heading" className="border-b border-stone-200 pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-stone-500">
              Aaja Ko Miti · Asia/Kathmandu (UTC+05:45)
            </p>
            <h1
              id="hero-heading"
              className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-5xl"
            >
              Nepali Calendar {today.bs.year} BS ({today.bs.monthNameEn})
            </h1>
            <p className="mt-3 text-lg text-stone-700">
              Today is{' '}
              <strong className="font-semibold text-[#9A3412]">
                {today.bs.monthNameEn} {today.bs.day}, {today.bs.year} BS
              </strong>{' '}
              ({today.bs.formattedNe}) · {today.weekday.en} ({today.weekday.ne})
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-stone-500">
              <Clock className="h-4 w-4 text-stone-400" aria-hidden="true" />
              <span>
                Gregorian: {today.ad.formattedEn} · Nepal Time: {today.nepalTime} NPT
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/aaja-ko-miti"
              onClick={(e) => handleLink(e, '/aaja-ko-miti')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#9A3412] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7C2D12] whitespace-nowrap shrink-0"
            >
              View Aaja Ko Miti
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="/rashifal"
              onClick={(e) => handleLink(e, '/rashifal')}
              className="inline-flex min-h-[44px] items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50 whitespace-nowrap shrink-0"
            >
              आजको राशिफल
            </a>
            <a
              href={`/holidays/${CURRENT_BS_YEAR}`}
              onClick={(e) => handleLink(e, `/holidays/${CURRENT_BS_YEAR}`)}
              className="inline-flex min-h-[44px] items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50 whitespace-nowrap shrink-0"
            >
              {CURRENT_BS_YEAR} Public Holidays
            </a>
          </div>
        </div>
      </section>

      {/* Reserved Top Leaderboard Ad Slot (Zero CLS) */}
      <div className="mt-6">
        <AdSlot variant="leaderboard" />
      </div>

      {/* Main 2-Column Workspace: Calendar Grid + Converter/Holidays Sidebar */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CalendarGrid
            bsYear={today.bs.year}
            bsMonth={today.bs.month}
            nowMs={nowMs}
            onNavigate={onNavigate}
          />

          {/* Quick 12-Month Navigation Strip */}
          <section aria-label={`${today.bs.year} BS Months`} className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-semibold text-stone-900">
                All Months of {today.bs.year} BS
              </h2>
              <a
                href={`/calendar/${today.bs.year}`}
                onClick={(e) => handleLink(e, `/calendar/${today.bs.year}`)}
                className="text-xs font-semibold text-[#9A3412] hover:underline"
              >
                Full {today.bs.year} Overview →
              </a>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {BS_MONTHS.map((m) => {
                const isCurrent = m.index === today.bs.month;
                return (
                  <a
                    key={m.slug}
                    href={`/calendar/${today.bs.year}/${m.slug}`}
                    onClick={(e) => handleLink(e, `/calendar/${today.bs.year}/${m.slug}`)}
                    className={`flex min-h-[48px] flex-col justify-center rounded-lg border px-3.5 py-2.5 transition-colors ${
                      isCurrent
                        ? 'border-[#9A3412] bg-[#9A3412]/5 text-[#9A3412]'
                        : 'border-stone-200 bg-white text-stone-800 hover:border-stone-300 hover:bg-[#F3EFE6]/50'
                    }`}
                  >
                    <span className="text-sm font-semibold">{m.en}</span>
                    <span className="text-xs text-stone-500">{m.ne}</span>
                  </a>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-8 lg:col-span-4">
          <section aria-labelledby="quick-converter-heading">
            <div className="flex items-baseline justify-between">
              <h2 id="quick-converter-heading" className="font-display text-xl font-semibold text-stone-900">
                Quick BS ↔ AD Converter
              </h2>
              <a
                href="/date-converter"
                onClick={(e) => handleLink(e, '/date-converter')}
                className="text-xs font-semibold text-[#9A3412] hover:underline"
              >
                Full Tool →
              </a>
            </div>
            <div className="mt-3">
              <DateConverter compact nowMs={nowMs} onNavigate={onNavigate} />
            </div>
          </section>

          <section aria-labelledby="upcoming-holidays-heading" className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
            <div className="flex items-baseline justify-between border-b border-stone-200 pb-3">
              <h2 id="upcoming-holidays-heading" className="font-display text-lg font-semibold text-stone-900">
                Upcoming {today.bs.year} Holidays
              </h2>
              <a
                href={`/holidays/${today.bs.year}`}
                onClick={(e) => handleLink(e, `/holidays/${today.bs.year}`)}
                className="text-xs font-semibold text-[#9A3412] hover:underline"
              >
                All Holidays →
              </a>
            </div>
            <ul className="mt-3 divide-y divide-stone-100">
              {upcomingHolidays.map((h) => {
                const ad = bsToAd(h.bsYear, h.bsMonth, h.bsDay);
                const mMeta = BS_MONTHS[h.bsMonth - 1];
                return (
                  <li key={h.id} className="py-3 first:pt-1 last:pb-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-stone-900">{h.nameEn}</span>
                      <span className="shrink-0 font-mono text-xs font-semibold text-[#9A3412] tabular-nums">
                        {mMeta.en.slice(0, 3)} {h.bsDay}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {h.nameNe} · {ad.monthShortEn} {ad.day}, {ad.year} ({ad.weekdayEn})
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3">
              <HolidayReferenceNote />
            </div>
          </section>

          <AdSlot variant="rectangle" />
        </aside>
      </div>

      {/* Daily Rashifal Feature Section */}
      <div className="mt-12">
        <RasifalSection nowMs={nowMs} onNavigate={onNavigate} />
      </div>

      {/* Browse Multi-Year Calendars */}
      <section aria-labelledby="years-browse-heading" className="mt-12 border-t border-stone-200 pt-10">
        <h2 id="years-browse-heading" className="font-display text-2xl font-semibold text-stone-900">
          Browse Nepali Calendars by Year
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Each annual edition shows its stored month lengths, corresponding Gregorian dates, and holiday listings for reference.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PUBLISHED_BS_YEARS.map((yr) => {
            const start = bsToAd(yr, 1, 1);
            return (
              <a
                key={yr}
                href={`/calendar/${yr}`}
                onClick={(e) => handleLink(e, `/calendar/${yr}`)}
                className="rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-[#9A3412]"
              >
                <p className="text-xs font-medium text-stone-500">
                  {start.year}–{start.year + 1} AD
                </p>
                <p className="mt-1 font-display text-xl font-semibold text-stone-900">
                  Nepali Calendar {yr} BS
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  नेपाली पात्रो {toDevanagariDigits(yr)}
                </p>
              </a>
            );
          })}
        </div>
      </section>

      <FaqSection faqs={faqs} />
    </div>
  );
};
