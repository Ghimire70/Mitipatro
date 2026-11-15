import React, { useEffect, useState } from 'react';
import { ArrowRight, Globe, Calendar, Sparkles } from 'lucide-react';
import { getTodayNepal, toDevanagariDigits } from '../../lib/bsConverter';
import { getHolidaysForDate } from '../../lib/holidays';
import type { FaqItem } from '../../lib/seo';
import { AdSlot } from '../components/AdSlot';
import { FaqSection } from '../components/FaqSection';
import { HolidayReferenceNote } from '../components/HolidayReferenceNote';

interface TodayPageProps {
  faqs: FaqItem[];
  nowMs?: number;
  onNavigate: (path: string) => void;
  rashifalIndexingEnabled?: boolean;
}

export const TodayPage: React.FC<TodayPageProps> = ({
  faqs,
  nowMs,
  onNavigate,
  rashifalIndexingEnabled = false,
}) => {
  const [today, setToday] = useState(() => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined));

  useEffect(() => {
    setToday(getTodayNepal());
    const id = window.setInterval(() => {
      setToday(getTodayNepal());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const holidaysToday = getHolidaysForDate(today.bs.year, today.bs.month, today.bs.day);

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
        <a href="/" onClick={(e) => handleLink(e, '/')} className="hover:text-[#9A3412] hover:underline">
          Home
        </a>
        <span className="mx-2">/</span>
        <span className="text-stone-800">Aaja Ko Miti</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        Aaja Ko Miti — {today.bs.formattedEn}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        Today&rsquo;s Nepali date is calculated using Nepal Standard Time (Asia/Kathmandu, UTC+05:45), wherever you access the site.
      </p>

      {/* Primary Today Card */}
      <section
        aria-label="Today's Nepali and English date"
        className="mt-8 rounded-xl border border-stone-200 bg-white p-6 shadow-xs sm:p-10"
      >
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9A3412]">
              Bikram Sambat (Nepali Date)
            </p>
            <p className="mt-2 font-display text-4xl font-bold text-stone-900 sm:text-5xl">
              {today.bs.monthNameNe} {toDevanagariDigits(today.bs.day)}, {toDevanagariDigits(today.bs.year)}
            </p>
            <p className="mt-2 text-xl font-medium text-stone-700">
              {today.bs.monthNameEn} {today.bs.day}, {today.bs.year} BS
            </p>
            <p className="mt-1 text-base text-stone-600">
              {today.weekday.en} · {today.weekday.ne}
            </p>
          </div>

          <div className="border-t border-stone-200 pt-6 sm:border-t-0 sm:border-l sm:pl-8 sm:pt-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
              Gregorian (AD) &amp; Nepal Time
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-stone-900 tabular-nums">
              {today.ad.formattedEn}
            </p>
            <p className="mt-2 flex items-center gap-2 font-mono text-sm text-stone-600 tabular-nums">
              <Globe className="h-4 w-4 text-[#9A3412]" aria-hidden="true" />
              <span>{today.nepalTime} NPT (UTC+05:45)</span>
            </p>
            <p className="mt-2 font-mono text-xs text-stone-500 tabular-nums">
              BS ISO: {today.bs.iso} · AD ISO: {today.ad.iso}
            </p>
          </div>
        </div>

        {/* Today's Holiday / Working Day Status */}
        <div className="mt-8 border-t border-stone-200 pt-5">
          {holidaysToday.length > 0 ? (
            <div className="space-y-2">
              <div className="space-y-1">
                {holidaysToday.map((h) => (
                  <p key={h.id} className="text-sm font-semibold text-[#9A3412]">
                    {h.nameEn} ({h.nameNe}) — {h.type === 'women_only'
                      ? 'Women-only Holiday'
                      : h.isPublicHoliday
                        ? 'Listed as a Public Holiday'
                        : 'Observance'}
                  </p>
                ))}
              </div>
              <HolidayReferenceNote />
            </div>
          ) : today.weekday.isHoliday ? (
            <p className="text-sm font-semibold text-[#9A3412]">
              Saturday is commonly observed as the weekly rest day (शनिबार).
            </p>
          ) : (
            <p className="text-sm text-stone-600">
              No holiday is listed in our calendar for this day.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/calendar/${today.bs.year}/${today.bs.monthSlug}`}
            onClick={(e) => handleLink(e, `/calendar/${today.bs.year}/${today.bs.monthSlug}`)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#9A3412] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7C2D12]"
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
            Open {today.bs.monthNameEn} {today.bs.year} Calendar
          </a>
          {rashifalIndexingEnabled && (
            <a
              href="/rashifal"
              onClick={(e) => handleLink(e, '/rashifal')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              <Sparkles className="h-4 w-4 text-[#9A3412]" aria-hidden="true" />
              आजको राशिफल हेर्नुहोस्
            </a>
          )}
          <a
            href="/date-converter"
            onClick={(e) => handleLink(e, '/date-converter')}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
          >
            Convert Another Date
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <div className="mt-8">
        <AdSlot variant="leaderboard" />
      </div>

      <FaqSection faqs={faqs} />
    </div>
  );
};
