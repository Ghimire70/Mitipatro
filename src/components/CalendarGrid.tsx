import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Printer, Sparkles } from 'lucide-react';
import {
  BS_MONTHS,
  PUBLISHED_BS_YEARS,
  WEEKDAYS,
} from '../../lib/bsData';
import {
  getBsMonthGrid,
  getTodayNepal,
  toDevanagariDigits,
  type CalendarCellData,
} from '../../lib/bsConverter';
import { getEventsForDate, getEventsForMonth, type EventEntry } from '../../lib/eventService';
import { HolidayReferenceNote } from './HolidayReferenceNote';
import { getDailyPanchanga } from '../../lib/astronomy/panchanga.js';
import { EditorialCalendarCell } from './EditorialCalendarCell';

interface CalendarGridProps {
  bsYear: number;
  bsMonth: number; // 1–12
  nowMs?: number;
  onNavigate?: (path: string) => void;
  showYearMonthControls?: boolean;
  rashifalIndexingEnabled?: boolean;
}

interface DayEvent {
  name: string;
  isPublicHoliday: boolean;
}

interface DayElementInfo {
  tithiName?: string;
  tithiIndex?: number;
  paksha?: 'shukla' | 'krishna';
  nakshatraName?: string;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  bsYear,
  bsMonth,
  nowMs,
  onNavigate,
  showYearMonthControls = true,
  rashifalIndexingEnabled = false,
}) => {
  const today = useMemo(() => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined), [nowMs]);
  const grid = useMemo(() => getBsMonthGrid(bsYear, bsMonth), [bsYear, bsMonth]);
  const monthEvents = useMemo(() => getEventsForMonth(bsYear, bsMonth), [bsYear, bsMonth]);

  // Build a map of bsDay -> holidays for fast lookup
  const eventsByDay = useMemo(() => {
    const map = new Map<number, DayEvent[]>();
    for (const e of monthEvents) {
      const existing = map.get(e.bsDay) ?? [];
      map.set(e.bsDay, [...existing, { name: e.nameEn, isPublicHoliday: e.isPublicHoliday }]);
    }
    return map;
  }, [monthEvents]);

  // Build element info (tithi/nakshatra) for each day in the month
  const elementsByDay = useMemo(() => {
    const map = new Map<number, DayElementInfo>();
    for (const cell of grid.days) {
      try {
        const instant = new Date(Date.UTC(cell.adYear, cell.adMonth - 1, cell.adDay, 12, 0, 0, 0));
        const panch = getDailyPanchanga(instant);
        map.set(cell.bsDay, {
          tithiName: panch.tithi.name,
          tithiIndex: panch.tithi.index,
          paksha: panch.tithi.paksha,
          nakshatraName: panch.nakshatra.name,
        });
      } catch {
        // Skip if computation fails for this date
      }
    }
    return map;
  }, [grid.days]);

  // Default selected day: today if in this month, otherwise day 1
  const defaultSelectedDay =
    today.bs.year === bsYear && today.bs.month === bsMonth ? today.bs.day : 1;
  const [selectedDay, setSelectedDay] = useState<number>(defaultSelectedDay);

  // Holiday highlight filter
  const [holidayFocus, setHolidayFocus] = useState(false);

  // Sync selected day if month/year changes externally
  React.useEffect(() => {
    setSelectedDay(today.bs.year === bsYear && today.bs.month === bsMonth ? today.bs.day : 1);
  }, [bsYear, bsMonth, today.bs.year, today.bs.month, today.bs.day]);

  const selectedCell: CalendarCellData =
    grid.days.find((d) => d.bsDay === selectedDay) ?? grid.days[0];
  const selectedEvents = getEventsForDate(
    selectedCell.bsYear,
    selectedCell.bsMonth,
    selectedCell.bsDay,
  );
  const selectedWeekday = WEEKDAYS[selectedCell.weekday];

  const totalSlots = grid.startWeekday + grid.days.length;
  const trailingCount = (7 - (totalSlots % 7)) % 7;

  const navigateTo = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigateTo(path);
  };

  const isPrevPublished =
    grid.prevMonth && (PUBLISHED_BS_YEARS as readonly number[]).includes(grid.prevMonth.year);
  const isNextPublished =
    grid.nextMonth && (PUBLISHED_BS_YEARS as readonly number[]).includes(grid.nextMonth.year);

  return (
    <section
      aria-label={`Print ${grid.monthMeta.en} ${bsYear} BS calendar`}
      className={`print-month-page rounded-xl border border-hairline bg-card shadow-editorial`}
    >
      {/* Top Month Toolbar */}
      <div className="flex flex-col gap-4 border-b border-hairline px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-ink">
              {grid.monthMeta.en} {bsYear}
            </h2>
            <span className="font-serif text-lg font-medium text-slatewarm">
              {grid.monthMeta.ne} {toDevanagariDigits(bsYear)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slatewarm">
            {grid.adSpanLabel} · {grid.totalDays} days · {grid.monthMeta.seasonEn}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Holiday Highlight Filter Toggle */}
          <button
            type="button"
            onClick={() => setHolidayFocus((prev) => !prev)}
            aria-pressed={holidayFocus}
            title="Highlight Public Holidays"
            className={`px-3 py-2 text-xs font-medium rounded-lg border bg-paper text-slatewarm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
              holidayFocus
                ? 'border-terracotta-border bg-terracotta-soft text-terracotta focus-visible:outline-terracotta'
                : 'border-hairline hover:text-ink hover:bg-sand focus-visible:outline-terracotta'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-terracotta"></span>
            <span>Holidays</span>
          </button>

          {showYearMonthControls && (
            <>
              <label htmlFor="cal-year-select" className="sr-only">
                Select BS Year
              </label>
              <select
                id="cal-year-select"
                value={bsYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  navigateTo(`/calendar/${y}/${grid.monthMeta.slug}`);
                }}
                className="editorial-select h-10 px-3 text-xs sm:text-sm font-medium text-ink bg-card border border-hairline rounded-lg focus:outline-none focus:border-terracotta transition-colors whitespace-nowrap shrink-0"
              >
                {PUBLISHED_BS_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y} BS
                  </option>
                ))}
              </select>

              <label htmlFor="cal-month-select" className="sr-only">
                Select BS Month
              </label>
              <select
                id="cal-month-select"
                value={grid.monthMeta.slug}
                onChange={(e) => {
                  navigateTo(`/calendar/${bsYear}/${e.target.value}`);
                }}
                className="editorial-select h-10 px-3 text-xs sm:text-sm font-medium text-ink bg-card border border-hairline rounded-lg focus:outline-none focus:border-terracotta transition-colors whitespace-nowrap shrink-0"
              >
                {BS_MONTHS.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.en} ({m.ne})
                  </option>
                ))}
              </select>
            </>
          )}

          <div className="flex items-center gap-1">
            {isPrevPublished && grid.prevMonth ? (
              <a
                href={`/calendar/${grid.prevMonth.year}/${grid.prevMonth.slug}`}
                onClick={(e) =>
                  handleLink(e, `/calendar/${grid.prevMonth!.year}/${grid.prevMonth!.slug}`)}
                aria-label={`Previous month: ${grid.prevMonth.nameEn} ${grid.prevMonth.year}`}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-hairline bg-card text-ink hover:bg-sand transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-stone-100 bg-stone-50 text-stone-300"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </span>
            )}

            {isNextPublished && grid.nextMonth ? (
              <a
                href={`/calendar/${grid.nextMonth.year}/${grid.nextMonth.slug}`}
                onClick={(e) =>
                  handleLink(e, `/calendar/${grid.nextMonth!.year}/${grid.nextMonth!.slug}`)}
                aria-label={`Next month: ${grid.nextMonth.nameEn} ${grid.nextMonth.year}`}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-hairline bg-card text-ink hover:bg-sand transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-stone-100 bg-stone-50 text-stone-300"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </div>

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-hairline bg-card text-ink hover:bg-sand transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            aria-label="Print calendar"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Print calendar</span>
          </button>
        </div>
      </div>

      {/* 7-Day Weekday Header (Saturday is Nepal's Weekly Holiday Column) */}
      <div role="grid" aria-label={`${grid.monthMeta.en} ${bsYear} days`}>
        <div
          role="row"
          className="grid grid-cols-7 border-b border-hairline bg-sand/65 text-center py-2.5 text-[11px] sm:text-xs font-semibold tracking-wide"
        >
          {WEEKDAYS.map((wd) => (
            <div
              key={wd.index}
              role="columnheader"
              aria-label={wd.isHoliday ? `${wd.en} (Weekly Holiday)` : wd.en}
              className={`text-center ${
                wd.isHoliday ? 'text-terracotta' : 'text-slatewarm'
              }`}
            >
              <span className="block sm:inline">{wd.shortEn}</span>
              <span className="hidden sm:inline text-slatewarm/60"> · </span>
              <span className="block sm:inline font-normal font-devanagari">{wd.shortNe}</span>
            </div>
          ))}
        </div>

        {/* Day Cells Grid */}
        <div className={`grid grid-cols-7 divide-x divide-y divide-hairline/80 border-b border-hairline ${holidayFocus ? '' : ''}`}>
          {Array.from({ length: grid.startWeekday }).map((_, idx) => (
            <div
              key={`empty-start-${idx}`}
              aria-hidden="true"
              className="min-h-[96px] bg-paper/45 p-2 sm:min-h-[112px]"
            />
          ))}

          {grid.days.map((cell) => {
            const eventsOnDay: DayEvent[] = eventsByDay.get(cell.bsDay) ?? [];
            const hasPublicHoliday = eventsOnDay.some((h) => h.isPublicHoliday);
            const isToday =
              today.bs.year === cell.bsYear &&
              today.bs.month === cell.bsMonth &&
              today.bs.day === cell.bsDay;
            const isSelected = selectedDay === cell.bsDay;

            const elementInfo = elementsByDay.get(cell.bsDay);

            const eventNames = eventsOnDay.map((h) => h.name);

            return (
              <EditorialCalendarCell
                key={cell.bsDay}
                cell={cell}
                bsYear={bsYear}
                bsMonth={bsMonth}
                eventsOnDay={eventNames}
                hasPublicHoliday={hasPublicHoliday}
                isToday={isToday}
                isSelected={isSelected}
                elementInfo={elementInfo}
                onSelect={(bsDay) => setSelectedDay(bsDay)}
                holidayFocus={holidayFocus}
              />
            );
          })}

          {Array.from({ length: trailingCount }).map((_, idx) => (
            <div
              key={`empty-end-${idx}`}
              aria-hidden="true"
              className="min-h-[96px] bg-paper/45 p-2 sm:min-h-[112px]"
            />
          ))}
        </div>
      </div>

      {/* Selected Day Detail Bar */}
      <div
        aria-live="polite"
        className="print-hidden flex flex-col gap-3 bg-paper/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-terracotta text-white flex flex-col items-center justify-center shrink-0 shadow-xs ring-2 ring-inset ring-terracotta">
            <span className="font-serif font-bold text-lg leading-none">{selectedCell.bsDay}</span>
            <span className="font-devanagari text-[10px] opacity-90 mt-0.5">{selectedCell.bsDayNe}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">
              {grid.monthMeta.en} {selectedCell.bsDay}, {selectedCell.bsYear} BS{' '}
              <span className="font-normal text-stone-600">
                ({grid.monthMeta.ne} {selectedCell.bsDayNe}, {toDevanagariDigits(selectedCell.bsYear)})
              </span>
            </p>
            <p className="mt-0.5 text-xs text-stone-600">
              {selectedWeekday.en} ({selectedWeekday.ne}) · Gregorian: {selectedCell.adMonthShort}{' '}
              {selectedCell.adDay}, {selectedCell.adYear} ({selectedCell.adIso})
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-stone-600">
          <div>
            {selectedEvents.length > 0 ? (
              <div className="space-y-1">
                {selectedEvents.map((e) => (
                  <p key={e.id} className="font-medium text-[#9A3412]">
                    {e.nameEn} ({e.nameNe}) · {e.isPublicHoliday
                      ? 'Public Holiday'
                      : 'Observance'}
                  </p>
                ))}
              </div>
            ) : selectedCell.isSaturday ? (
              <p className="font-medium text-[#9A3412]">Saturday is commonly observed as the weekly rest day.</p>
            ) : (
              <p className="text-stone-500">No holiday is listed in our calendar for this day.</p>
            )}
          </div>

          {rashifalIndexingEnabled && (
            <a
              href="/rashifal"
              onClick={(e) => handleLink(e, '/rashifal')}
              className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-[#9A3412] hover:underline whitespace-nowrap shrink-0 self-start sm:self-auto sm:border-l sm:border-stone-200 sm:pl-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              राशिफल हेर्नुहोस्
            </a>
          )}

          <a
            href="/date-converter"
            onClick={(e) => handleLink(e, '/date-converter')}
            className="self-start sm:self-center text-xs font-semibold text-terracotta hover:text-terracotta-hover inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-card border border-hairline hover:border-terracotta-border transition-colors shrink-0 min-h-[44px] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            <span>Open in Converter</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      {/* Month Events Summary Strip */}
      {monthEvents.length > 0 && (
        <div className="border-t border-hairline px-4 py-4 sm:px-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slatewarm">
            Events &amp; Observances in {grid.monthMeta.en} {bsYear}
          </h3>
          <div className="mt-2">
            <HolidayReferenceNote />
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {monthEvents.map((e) => (
              <li
                key={e.id}
                className="flex items-baseline justify-between gap-3 border-b border-stone-100 pb-2 text-sm last:border-b-0"
              >
                <span className="text-stone-800">
                  <strong className="font-mono font-semibold tabular-nums text-[#9A3412]">
                    {grid.monthMeta.en.slice(0, 3)} {e.bsDay}
                  </strong>
                  {' · '}
                  {e.nameEn}
                  {e.isPublicHoliday ? (
                    <span className="text-xs text-[#9A3412]"> (Public Holiday)</span>
                  ) : (
                    <span className="text-xs text-stone-500"> (Observance)</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-stone-500">{e.nameNe}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
