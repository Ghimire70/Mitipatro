import React, { useMemo, useState } from 'react';
import { Printer, Download, Calendar } from 'lucide-react';
import { bsToAd, getBsMonthGrid, getTodayNepal, toDevanagariDigits } from '../../lib/bsConverter';
import { BS_MONTHS, CURRENT_BS_YEAR, PUBLISHED_BS_YEARS } from '../../lib/bsData';
import { getHolidaysForMonth } from '../../lib/holidays';
import type { FaqItem } from '../../lib/seo';
import { CalendarGrid } from '../components/CalendarGrid';
import { AdSlot } from '../components/AdSlot';
import { FaqSection } from '../components/FaqSection';
import { HolidayReferenceNote } from '../components/HolidayReferenceNote';
import { ToastBanner } from '../components/ToastBanner';

interface PrintCalendarPageProps {
  faqs: FaqItem[];
  nowMs?: number;
  onNavigate: (path: string) => void;
}

export const PrintCalendarPage: React.FC<PrintCalendarPageProps> = ({
  faqs,
  nowMs,
  onNavigate,
}) => {
  const today = useMemo(() => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined), [nowMs]);
  const currentYear = today.bs.year;
  const availableYears = PUBLISHED_BS_YEARS.filter((y) => y <= currentYear + 1);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
  const [toastMessage, setToastMessage] = useState<string>('');

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  const handleToggleMonth = (month: number) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  };

  const handlePrintMonth = (year: number, month: number) => {
    const monthMeta = BS_MONTHS[month - 1];
    onNavigate(`/calendar/${year}/${monthMeta.slug}`);
    setToastMessage(`Opening ${monthMeta.en} ${year} BS for printing...`);
  };

  const handlePrintAll = (year: number) => {
    onNavigate(`/calendar/${year}/baisakh`);
    setToastMessage(`Opening ${year} BS calendar for printing...`);
  };

  const handleCloseToast = () => setToastMessage('');

  const yearGrids = useMemo(() => {
    return BS_MONTHS.map((m) => {
      const grid = getBsMonthGrid(selectedYear, m.index);
      const firstAd = bsToAd(selectedYear, m.index, 1);
      const lastAd = bsToAd(selectedYear, m.index, grid.totalDays);
      const holidays = getHolidaysForMonth(selectedYear, m.index);
      const publicHolidays = holidays.filter((h) => h.isPublicHoliday);
      return {
        monthMeta: m,
        grid,
        firstAd,
        lastAd,
        holidays: publicHolidays,
      };
    });
  }, [selectedYear]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(Number(e.target.value));
    setExpandedMonths(new Set());
  };

  return (
    <div className="print-calendar-page mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <ToastBanner
        message={toastMessage}
        visible={toastMessage.length > 0}
        onClose={handleCloseToast}
      />

      <nav aria-label="Breadcrumb" className="print-hidden text-xs text-stone-500">
        <a href="/" onClick={(e) => handleLink(e, '/')} className="hover:text-[#9A3412] hover:underline">
          Home
        </a>
        <span className="mx-2">/</span>
        <span className="text-stone-800">Print Nepali Calendar</span>
      </nav>

      <header className="print-header mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Print Nepali Calendar <span className="text-[#9A3412]">{selectedYear} BS</span>
            </h1>
            <p className="mt-2 text-lg text-stone-600">
              Free printable monthly calendars with Bikram Sambat dates, Gregorian equivalents, Saturdays, and public holidays.
              Optimized for A4 printing.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="editorial-select min-h-[44px] rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              aria-label="Select calendar year"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr} BS ({bsToAd(yr, 1, 1).year}–{bsToAd(yr, 12, getBsMonthGrid(yr, 12).totalDays).year} AD)
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handlePrintAll(selectedYear)}
              className="print-hidden inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#9A3412] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7C2D12] whitespace-nowrap shrink-0"
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              View First Month
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 print-hidden">
          <a
            href={`/calendar/${selectedYear}`}
            onClick={(e) => handleLink(e, `/calendar/${selectedYear}`)}
            className="text-sm font-semibold text-[#9A3412] hover:underline"
          >
            View Full {selectedYear} BS Year Overview →
          </a>
          <span className="text-sm text-stone-500">|</span>
          <a
            href={`/holidays/${selectedYear}`}
            onClick={(e) => handleLink(e, `/holidays/${selectedYear}`)}
            className="text-sm font-semibold text-[#9A3412] hover:underline"
          >
            {selectedYear} BS Holidays List →
          </a>
        </div>
      </header>

      <div className="print-hidden mt-6">
        <AdSlot variant="leaderboard" />
      </div>

      <section aria-label={`${selectedYear} BS Monthly Calendars`} className="mt-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {yearGrids.map(({ monthMeta, grid, firstAd, lastAd, holidays }) => {
            const isExpanded = expandedMonths.has(monthMeta.index);
            const holidayNames = holidays.slice(0, 3).map((h) => h.nameEn).join(', ');

            return (
              <article
                key={monthMeta.index}
                className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 bg-[#FAF8F5]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#9A3412]/10 text-[#9A3412] font-display text-xl font-semibold">
                      {monthMeta.index}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-stone-900">
                        {monthMeta.en} {selectedYear}
                      </h3>
                      <p className="text-xs text-stone-500">{monthMeta.ne} {toDevanagariDigits(selectedYear)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleMonth(monthMeta.index)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
                    aria-label={isExpanded ? `Collapse ${monthMeta.en}` : `Expand ${monthMeta.en}`}
                    aria-expanded={isExpanded}
                  >
                    <Calendar className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="font-medium text-stone-500">Starts:</span>{' '}
                      <span className="text-stone-800">{firstAd.weekdayEn}, {firstAd.formattedEn}</span>
                    </div>
                    <div>
                      <span className="font-medium text-stone-500">Ends:</span>{' '}
                      <span className="text-stone-800">{lastAd.weekdayEn}, {lastAd.formattedEn}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-stone-500">Days:</span>{' '}
                      <span className="text-stone-800">{grid.totalDays}</span>
                    </div>
                  </div>

                  {holidays.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-stone-500 mb-1">Public Holidays:</p>
                      <p className="text-xs text-stone-700 line-clamp-2">{holidayNames}{holidays.length > 3 ? '...' : ''}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrintMonth(selectedYear, monthMeta.index)}
                      className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                    >
                      <Printer className="h-4 w-4" aria-hidden="true" />
                      Print Month
                    </button>
                    <a
                      href={`/calendar/${selectedYear}/${monthMeta.slug}`}
                      onClick={(e) => handleLink(e, `/calendar/${selectedYear}/${monthMeta.slug}`)}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      View Details
                    </a>
                  </div>
                </div>

                {isExpanded && (
                  <div className="print-calendar-preview border-t border-stone-100 bg-[#FAF8F5] p-4">
                    <CalendarGrid
                      bsYear={selectedYear}
                      bsMonth={monthMeta.index}
                      nowMs={nowMs}
                      onNavigate={onNavigate}
                      printPreview
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="print-tips-heading" className="mt-12 rounded-xl border border-stone-200 bg-white p-6 shadow-xs print-hidden">
        <h2 id="print-tips-heading" className="font-display text-xl font-semibold text-stone-900">
          Printing Tips
        </h2>
        <ul className="mt-4 space-y-3 text-sm text-stone-700">
          <li className="flex gap-3">
            <Printer className="h-5 w-5 text-[#9A3412] shrink-0 mt-0.5" aria-hidden="true" />
            <span>Use <strong>Ctrl+P</strong> (Windows) or <strong>Cmd+P</strong> (Mac) to print any monthly calendar page.</span>
          </li>
          <li className="flex gap-3">
            <span className="h-5 w-5 flex-shrink-0 flex items-center justify-center rounded-full bg-[#9A3412]/10 text-[#9A3412] text-xs font-bold">1</span>
            <span>Select <strong>Landscape</strong> orientation for best fit on A4 paper.</span>
          </li>
          <li className="flex gap-3">
            <span className="h-5 w-5 flex-shrink-0 flex items-center justify-center rounded-full bg-[#9A3412]/10 text-[#9A3412] text-xs font-bold">2</span>
            <span>Set margins to <strong>Minimum</strong> or <strong>Narrow</strong> in print settings.</span>
          </li>
          <li className="flex gap-3">
            <span className="h-5 w-5 flex-shrink-0 flex items-center justify-center rounded-full bg-[#9A3412]/10 text-[#9A3412] text-xs font-bold">3</span>
            <span>Enable <strong>Background graphics</strong> to show holiday highlights and Saturday colors.</span>
          </li>
          <li className="flex gap-3">
            <span className="h-5 w-5 flex-shrink-0 flex items-center justify-center rounded-full bg-[#9A3412]/10 text-[#9A3412] text-xs font-bold">4</span>
            <span>Each month prints on a single A4 page with clean, readable layout.</span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="other-years-heading" className="mt-12">
        <h2 id="other-years-heading" className="font-display text-2xl font-semibold text-stone-900">
          Other Available Years
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Print calendars for previous or upcoming Bikram Sambat years.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {availableYears
            .filter((yr) => yr !== selectedYear)
            .map((yr) => {
              const start = bsToAd(yr, 1, 1);
              return (
                <a
                  key={yr}
                  href={`/print-nepali-calendar?year=${yr}`}
                  onClick={(e) => {
                    handleLink(e, `/print-nepali-calendar?year=${yr}`);
                    setSelectedYear(yr);
                  }}
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