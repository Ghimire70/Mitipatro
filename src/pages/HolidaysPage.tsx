import React, { useMemo, useState } from 'react';
import { BS_MONTHS, PUBLISHED_BS_YEARS } from '../../lib/bsData';
import { bsToAd, toDevanagariDigits } from '../../lib/bsConverter';
import { getHolidaysForYear, type HolidayType } from '../../lib/holidays';
import type { FaqItem } from '../../lib/seo';
import { AdSlot } from '../components/AdSlot';
import { FaqSection } from '../components/FaqSection';
import { HolidayReferenceNote } from '../components/HolidayReferenceNote';

interface HolidaysPageProps {
  year: number;
  faqs: FaqItem[];
  onNavigate: (path: string) => void;
}

const TYPE_LABEL: Record<HolidayType, string> = {
  national: 'National Festival',
  cultural: 'Cultural',
  civic: 'Civic Day',
  regional: 'Regional',
  women: 'Women’s Holiday',
  women_only: 'Women-only Holiday',
};

export const HolidaysPage: React.FC<HolidaysPageProps> = ({ year, faqs, onNavigate }) => {
  const [filter, setFilter] = useState<'all' | 'public' | 'observance'>('all');
  const allHolidays = useMemo(() => getHolidaysForYear(year), [year]);

  const filteredHolidays = useMemo(() => {
    if (filter === 'public') return allHolidays.filter((h) => h.isPublicHoliday);
    if (filter === 'observance') return allHolidays.filter((h) => !h.isPublicHoliday);
    return allHolidays;
  }, [allHolidays, filter]);

  const publicCount = allHolidays.filter((h) => h.isPublicHoliday).length;

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
        <a href="/" onClick={(e) => handleLink(e, '/')} className="hover:text-[#9A3412] hover:underline">
          Home
        </a>
        <span className="mx-2">/</span>
        <span className="text-stone-800">Public Holidays {year} BS</span>
      </nav>

      <div className="mt-4 flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Holidays and Observances in Nepal – {year} BS
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
            Bikram Sambat {year} ({toDevanagariDigits(year)}) holiday and observance entries with Gregorian (AD) dates generated using the supported conversion table. Showing {publicCount} entries marked as public holidays.
          </p>
          <div className="mt-3">
            <HolidayReferenceNote />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PUBLISHED_BS_YEARS.map((yr) => (
            <a
              key={yr}
              href={`/holidays/${yr}`}
              onClick={(e) => handleLink(e, `/holidays/${yr}`)}
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

      {year > 2083 && (
        <div className="mt-6 rounded-lg border border-stone-200 bg-[#F3EFE6]/70 px-4 py-3 text-sm text-stone-700">
          Note: Only some fixed-date observances are currently listed for {year} BS. Lunar festival entries (Dashain, Tihar, Lhosar, Shivaratri, Holi) are not currently included.
        </div>
      )}

      <div className="mt-6">
        <AdSlot variant="leaderboard" />
      </div>

      {/* Interactive Filter Tabs */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter holidays"
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
            All ({allHolidays.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'public'}
            onClick={() => setFilter('public')}
            className={`min-h-[40px] rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              filter === 'public' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Public Holidays ({publicCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'observance'}
            onClick={() => setFilter('observance')}
            className={`min-h-[40px] rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              filter === 'observance'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Observances ({allHolidays.length - publicCount})
          </button>
        </div>

        <a
          href={`/calendar/${year}`}
          onClick={(e) => handleLink(e, `/calendar/${year}`)}
          className="text-xs font-semibold text-[#9A3412] hover:underline"
        >
          Open {year} BS Monthly Calendars →
        </a>
      </div>

      {/* Holiday Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        {filteredHolidays.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-stone-500">
            No records match the selected filter for {year} BS.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-[#F3EFE6]/60 text-xs font-semibold uppercase tracking-wider text-stone-600">
              <tr>
                <th className="px-4 py-3">BS Date</th>
                <th className="px-4 py-3">AD Date</th>
                <th className="px-4 py-3">Holiday / Festival</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredHolidays.map((h) => {
                const mMeta = BS_MONTHS[h.bsMonth - 1];
                const ad = bsToAd(h.bsYear, h.bsMonth, h.bsDay);
                return (
                  <tr key={h.id} className="hover:bg-[#FBF9F5]">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <a
                        href={`/calendar/${h.bsYear}/${mMeta.slug}`}
                        onClick={(e) => handleLink(e, `/calendar/${h.bsYear}/${mMeta.slug}`)}
                        className="font-mono font-semibold text-[#9A3412] hover:underline tabular-nums"
                      >
                        {mMeta.en} {h.bsDay}, {h.bsYear}
                      </a>
                      <div className="text-xs text-stone-500">
                        {mMeta.ne} {toDevanagariDigits(h.bsDay)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs text-stone-700 tabular-nums">
                      <div>{ad.formattedEn}</div>
                      <div className="text-stone-500">{ad.weekdayEn}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-stone-900">{h.nameEn}</div>
                      <div className="text-xs text-stone-600">{h.nameNe}</div>
                      {h.noteEn && <div className="mt-0.5 text-xs text-stone-500">{h.noteEn}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-stone-600 whitespace-nowrap">
                      {TYPE_LABEL[h.type]}
                    </td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                      {h.type === 'women_only' ? (
                        <span className="font-semibold text-stone-700">Women-only Holiday</span>
                      ) : h.isPublicHoliday ? (
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
    </div>
  );
};
