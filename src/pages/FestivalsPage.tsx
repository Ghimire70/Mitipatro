import React, { useMemo, useState } from 'react';
import { BS_MONTHS, PUBLISHED_BS_YEARS } from '../../lib/bsData';
import { bsToAd, toDevanagariDigits } from '../../lib/bsConverter';
import { getEventsForYear, getEventCategoriesForMonth } from '../../lib/eventService';
import type { FaqItem } from '../../lib/seo';
import { AdSlot } from '../components/AdSlot';
import { FaqSection } from '../components/FaqSection';
import { HolidayReferenceNote } from '../components/HolidayReferenceNote';

const TRISAMBAT_ATTRIBUTION = {
  name: 'Trisambat',
  url: 'https://trisambat.com',
  label: 'Festival data from Trisambat Nepali Calendar API',
};

interface FestivalsPageProps {
  year: number;
  faqs: FaqItem[];
  onNavigate: (path: string) => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  religious_festival: 'Religious Festival',
  religious_observance: 'Religious Observance',
  public_holiday: 'Public Holiday',
  national_day: 'National Day',
  cultural_regional: 'Cultural / Regional',
  international: 'International',
};

const CATEGORY_COLOR: Record<string, string> = {
  religious_festival: 'text-[#9A3412]',
  religious_observance: 'text-stone-700',
  public_holiday: 'text-[#9A3412] font-semibold',
  national_day: 'text-[#9A3412]',
  cultural_regional: 'text-stone-600',
  international: 'text-stone-500',
};

export const FestivalsPage: React.FC<FestivalsPageProps> = ({
  year,
  faqs,
  onNavigate,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const allEvents = useMemo(() => getEventsForYear(year), [year]);
  const publicCount = allEvents.filter((e) => e.isPublicHoliday).length;
  const availableCategories = useMemo(
    () => getEventCategoriesForMonth(year, 1), // placeholder; categories are year-wide
    [year],
  );

  // Build category list from all events for this year
  const categorySet = useMemo(() => {
    const set = new Set<string>();
    for (const e of allEvents) set.add(e.category);
    return set;
  }, [allEvents]);

  const hasTrisambatEvents = allEvents.some((e) => e.sourceType === 'trisambat');

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return allEvents;
    return allEvents.filter((e) => e.category === filter);
  }, [allEvents, filter]);

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
        <span className="text-stone-800">Festivals &amp; Events {year} BS</span>
      </nav>

      <header className="mt-4 border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Festivals &amp; Events — {year} BS
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
              Complete festival and observance calendar for Bikram Sambat {year}
              ({toDevanagariDigits(year)}). Events are sourced from official
              government notices, Panchanga calculations, and international
              observance calendars. Dates without events render normally on the
              monthly calendar.
            </p>
            <div className="mt-3">
              <HolidayReferenceNote />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PUBLISHED_BS_YEARS.map((yr) => (
              <a
                key={yr}
                href={`/festivals/${yr}`}
                onClick={(e) => handleLink(e, `/festivals/${yr}`)}
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

        {/* Trisambat attribution — required by API terms when displaying API data */}
        {hasTrisambatEvents && (
          <div className="mt-4 rounded-lg border border-stone-200 bg-[#F3EFE6]/50 px-4 py-3 text-xs text-stone-600">
            Festival data supplemented by{' '}
            <a
              href={TRISAMBAT_ATTRIBUTION.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#9A3412] hover:underline font-semibold"
            >
              {TRISAMBAT_ATTRIBUTION.name} Nepali Calendar API
            </a>{' — '}
            {TRISAMBAT_ATTRIBUTION.label}. Data is provided as-is and is not an
            official government calendar.
          </div>
        )}

        <div className="mt-6 rounded-lg border border-stone-200 bg-[#F3EFE6]/70 px-4 py-3 text-sm text-stone-700">
          {year > 2083 && (
            <>
              Lunar festival entries for {year} BS are pending official Nepal
              Gazette notice. Currently listed: fixed civic dates and
              internationally observed days.
            </>
          )}
        </div>

        <div className="mt-6">
          <AdSlot variant="leaderboard" />
        </div>

        {/* Interactive Filter Tabs */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Filter festivals"
            className="inline-flex rounded-lg bg-[#F3EFE6] p-1 self-start"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              onClick={() => setFilter('all')}
              className={`min-h-[40px] rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                filter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All ({allEvents.length})
            </button>
            {[...categorySet].sort().map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={filter === cat}
                onClick={() => setFilter(cat)}
                className={`min-h-[40px] rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  filter === cat ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {CATEGORY_LABEL[cat] || cat} ({allEvents.filter((e) => e.category === cat).length})
              </button>
            ))}
          </div>

          <a
            href={`/calendar/${year}`}
            onClick={(e) => handleLink(e, `/calendar/${year}`)}
            className="text-xs font-semibold text-[#9A3412] hover:underline"
          >
            Open {year} BS Monthly Calendars →
          </a>
        </div>

        {/* Event Table */}
        <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
          {filteredEvents.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-stone-500">
              No festivals or events match the selected filter for {year} BS.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-[#F3EFE6]/60 text-xs font-semibold uppercase tracking-wider text-stone-600">
                <tr>
                  <th className="px-4 py-3">BS Date</th>
                  <th className="px-4 py-3">AD Date</th>
                  <th className="px-4 py-3">Festival / Event</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Source / Verification</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredEvents.map((e) => {
                  const mMeta = BS_MONTHS[e.bsMonth - 1];
                  const ad = bsToAd(e.bsYear, e.bsMonth, e.bsDay);
                  return (
                    <tr key={e.id} className="hover:bg-[#FBF9F5]">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <a
                          href={`/calendar/${e.bsYear}/${mMeta.slug}`}
                          onClick={(ev) =>
                            handleLink(ev, `/calendar/${e.bsYear}/${mMeta.slug}`)}
                          className="font-mono font-semibold text-[#9A3412] hover:underline tabular-nums"
                        >
                          {mMeta.en} {e.bsDay}, {e.bsYear}
                        </a>
                        <div className="text-xs text-stone-500">
                          {mMeta.ne} {toDevanagariDigits(e.bsDay)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs text-stone-700 tabular-nums">
                        <div>{ad.formattedEn}</div>
                        <div className="text-stone-500">{ad.weekdayEn}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-stone-900">{e.nameEn}</div>
                        <div className="text-xs text-stone-600">{e.nameNe}</div>
                        {e.descriptionEn && (
                          <div className="mt-0.5 text-xs text-stone-500">{e.descriptionEn}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        <span className={`${CATEGORY_COLOR[e.category] || 'text-stone-600'}`}>
                          {CATEGORY_LABEL[e.category] || e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        <span className="text-stone-500">{e.verificationStatus}</span>
                        {e.apiVerified !== undefined && (
                          <>
                            <br />
                            <span className="text-[10px] text-stone-400">
                              API verified: {e.apiVerified ? 'yes' : 'no'}
                            </span>
                          </>
                        )}
                        <br />
                        <span className="text-[10px] text-stone-400">{e.source}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        {e.isPublicHoliday ? (
                          <span className="font-semibold text-[#9A3412]">Public Holiday</span>
                        ) : (
                          <span className="text-stone-500">Observance</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <FaqSection faqs={faqs} />
      </header>
    </div>
  );
};
