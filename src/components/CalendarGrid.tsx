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
import { useLocale } from '../../contexts/LocaleContext';
import { formatLocaleYear, formatLocaleNumber } from '../../lib/i18n/format';

interface CalendarGridProps {
  bsYear: number;
  bsMonth: number; // 1–12
  nowMs?: number;
  onNavigate?: (path: string) => void;
  showYearMonthControls?: boolean;
  rashifalIndexingEnabled?: boolean;
  printPreview?: boolean;
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
  printPreview = false,
}) => {
  const today = useMemo(() => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined), [nowMs]);
  const { locale, t } = useLocale();
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
      className={`print-month-page rounded-xl border border-stone-200 bg-white shadow-xs`}
    >
      {/* Top Month Toolbar */}
      <div className="flex flex-col gap-4 border-b border-stone-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-2xl font-semibold text-stone-900">
              {locale === 'ne'
                ? `${grid.monthMeta.ne} ${formatLocaleNumber(bsYear, locale)} वि.सं.`
                : `${grid.monthMeta.en} ${formatLocaleNumber(bsYear, locale)} BS`}
            </h2>
            <span className="font-display text-xl text-stone-600">
              {locale === 'ne'
                ? `${grid.monthMeta.en} ${formatLocaleNumber(bsYear, locale)} BS`
                : `${grid.monthMeta.ne} ${formatLocaleNumber(bsYear, locale)} वि.सं.`}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            {locale === 'ne'
              ? `${grid.adSpanLabel} · ${formatLocaleNumber(grid.totalDays, locale)} दिन · ${grid.monthMeta.seasonNe}`
              : `${grid.adSpanLabel} · ${formatLocaleNumber(grid.totalDays, locale)} days · ${grid.monthMeta.seasonEn}`}
          </p>
          <p className="mt-0.5 text-[9px] font-semibold text-[#9A3412] uppercase tracking-tighter">
            mitipatro
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showYearMonthControls && (
            <>
              <label htmlFor="cal-year-select" className="sr-only">
                {t('calendar.bsYearSelect')}
              </label>
              <select
                id="cal-year-select"
                value={bsYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  navigateTo(`/calendar/${y}/${grid.monthMeta.slug}`);
                }}
                className="h-10 rounded-md border border-stone-200 bg-[#FBF9F5] px-2.5 text-sm font-medium text-stone-800 focus-visible:outline-2 focus-visible:outline-[#9A3412]"
              >
                {PUBLISHED_BS_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y} BS
                  </option>
                ))}
              </select>

              <label htmlFor="cal-month-select" className="sr-only">
                {t('calendar.bsMonthSelect')}
              </label>
              <select
                id="cal-month-select"
                value={grid.monthMeta.slug}
                onChange={(e) => {
                  navigateTo(`/calendar/${bsYear}/${e.target.value}`);
                }}
                className="h-10 rounded-md border border-stone-200 bg-[#FBF9F5] px-2.5 text-sm font-medium text-stone-800 focus-visible:outline-2 focus-visible:outline-[#9A3412]"
              >
                {BS_MONTHS.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {locale === 'ne' ? m.ne : m.en}
                  </option>
                ))}
              </select>
            </>
          )}

          <div className="flex items-center gap-1.5">
            {isPrevPublished && grid.prevMonth ? (
              <a
                href={`/calendar/${grid.prevMonth.year}/${grid.prevMonth.slug}`}
                onClick={(e) =>
                  handleLink(e, `/calendar/${grid.prevMonth!.year}/${grid.prevMonth!.slug}`)}
                aria-label={locale === 'ne' ? `अघिल्लो महिना: ${grid.prevMonth.nameEn} ${formatLocaleNumber(grid.prevMonth.year, locale)}` : `Previous month: ${grid.prevMonth.nameEn} ${formatLocaleNumber(grid.prevMonth.year, locale)}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-[#9A3412]"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-100 bg-stone-50 text-stone-300"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </span>
            )}

            {isNextPublished && grid.nextMonth ? (
              <a
                href={`/calendar/${grid.nextMonth.year}/${grid.nextMonth.slug}`}
                onClick={(e) =>
                  handleLink(e, `/calendar/${grid.nextMonth!.year}/${grid.nextMonth!.slug}`)}
                aria-label={locale === 'ne' ? `अर्को महिना: ${grid.nextMonth.nameEn} ${formatLocaleNumber(grid.nextMonth.year, locale)}` : `Next month: ${grid.nextMonth.nameEn} ${formatLocaleNumber(grid.nextMonth.year, locale)}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-[#9A3412]"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-100 bg-stone-50 text-stone-300"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </div>

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-[#9A3412]"
            aria-label={t('calendar.printCalendar')}
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{t('calendar.printCalendar')}</span>
          </button>
        </div>
      </div>

      {/* 7-Day Weekday Header (Saturday is Nepal's Weekly Holiday Column) */}
      <div role="grid" aria-label={`${grid.monthMeta.en} ${bsYear} days`}>
        <div
          role="row"
          className="grid grid-cols-7 border-b border-stone-200 bg-[#F3EFE6]/60 text-center"
        >
          {WEEKDAYS.map((wd) => (
            <div
              key={wd.index}
              role="columnheader"
              aria-label={locale === 'ne' ? wd.ne : wd.en}
              className={`py-2.5 text-xs font-semibold tracking-wide ${
                wd.isHoliday ? 'text-[#9A3412]' : 'text-stone-600'
              }`}
            >
              {locale === 'ne' ? (
                <span className="block sm:inline">{wd.shortNe}</span>
              ) : (
                <span className="block sm:inline">{wd.shortEn}</span>
              )}
            </div>
          ))}
        </div>

        {/* Day Cells Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-stone-100 border-b border-stone-200">
          {Array.from({ length: grid.startWeekday }).map((_, idx) => (
            <div
              key={`empty-start-${idx}`}
              aria-hidden="true"
              className="min-h-[96px] bg-stone-50/60 sm:min-h-[112px]"
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

            // Get element info (tithi/nakshatra) for this day
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
              />
            );
          })}

          {Array.from({ length: trailingCount }).map((_, idx) => (
            <div
              key={`empty-end-${idx}`}
              aria-hidden="true"
              className="min-h-[96px] bg-stone-50/60 sm:min-h-[112px]"
            />
          ))}
        </div>
      </div>

      {/* Selected Day Detail Bar */}
      <div
        aria-live="polite"
        className="print-hidden flex flex-col gap-3 bg-[#FBF9F5] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div className="flex items-start gap-3">
          <CalendarIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#9A3412]" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-stone-900">
              {locale === 'ne'
                ? `${grid.monthMeta.ne} ${formatLocaleNumber(selectedCell.bsDay, locale)}, ${formatLocaleNumber(selectedCell.bsYear, locale)} वि.सं.`
                : `${grid.monthMeta.en} ${formatLocaleNumber(selectedCell.bsDay, locale)}, ${formatLocaleNumber(selectedCell.bsYear, locale)} BS`}
            </p>
            <p className="mt-0.5 text-xs text-stone-600">
              {locale === 'ne'
                ? `${selectedWeekday.ne} · ग्रेगोरियन: ${selectedCell.adMonthShort} ${formatLocaleNumber(selectedCell.adDay, locale)}, ${formatLocaleNumber(selectedCell.adYear, locale)} (${selectedCell.adIso})`
                : `${selectedWeekday.en} · Gregorian: ${selectedCell.adMonthShort} ${formatLocaleNumber(selectedCell.adDay, locale)}, ${formatLocaleNumber(selectedCell.adYear, locale)} (${selectedCell.adIso})`}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-stone-600">
          <div>
            {selectedEvents.length > 0 ? (
              <div className="space-y-1">
                {selectedEvents.map((e) => (
                  <p key={e.id} className="font-medium text-[#9A3412]">
                    {locale === 'ne' ? e.nameNe : e.nameEn} {locale === 'ne' ? '' : `(${e.nameNe})`} · {locale === 'ne'
                      ? e.isPublicHoliday
                        ? 'सार्वजनिक बिदा'
                        : 'अवलोकन'
                      : e.isPublicHoliday
                        ? 'Public Holiday'
                        : 'Observance'}
                  </p>
                ))}
              </div>
            ) : selectedCell.isSaturday ? (
              <p className="font-medium text-[#9A3412]">{t('calendar.weeklyRest')}</p>
            ) : (
              <p className="text-stone-500">{t('calendar.noHolidayListed')}</p>
            )}
          </div>

          {rashifalIndexingEnabled && (
            <a
              href="/rashifal"
              onClick={(e) => handleLink(e, '/rashifal')}
              className="inline-flex items-center gap-1.5 font-semibold text-[#9A3412] hover:underline whitespace-nowrap self-start sm:self-auto sm:border-l sm:border-stone-200 sm:pl-3"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              राशिफल हेर्नुहोस्
            </a>
          )}
        </div>
      </div>

      {/* Month Events Summary Strip */}
      {monthEvents.length > 0 && (
        <div className="border-t border-stone-200 px-4 py-4 sm:px-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            {locale === 'ne'
              ? `${grid.monthMeta.ne} ${formatLocaleNumber(bsYear, locale)} वि.सं.मा कार्यक्रम र अवलोकन`
              : `Events & Observances in ${grid.monthMeta.en} ${formatLocaleNumber(bsYear, locale)}`}
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
                    {locale === 'ne' ? grid.monthMeta.ne : grid.monthMeta.en.slice(0, 3)} {formatLocaleNumber(e.bsDay, locale)}
                  </strong>
                  {' · '}
                  {locale === 'ne' ? e.nameNe : e.nameEn}
                  {e.isPublicHoliday ? (
                    <span className="text-xs text-[#9A3412]">
                      {locale === 'ne' ? ' (सार्वजनिक बिदा)' : ' (Public Holiday)'}
                    </span>
                  ) : (
                    <span className="text-xs text-stone-500">
                      {locale === 'ne' ? ' (अवलोकन)' : ' (Observance)'}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-stone-500">
                  {locale === 'ne' ? e.nameEn : e.nameNe}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
