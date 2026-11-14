import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
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
import { getHolidaysForDate, getHolidaysForMonth } from '../../lib/holidays';

interface CalendarGridProps {
  bsYear: number;
  bsMonth: number; // 1–12
  nowMs?: number;
  onNavigate?: (path: string) => void;
  showYearMonthControls?: boolean;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  bsYear,
  bsMonth,
  nowMs,
  onNavigate,
  showYearMonthControls = true,
}) => {
  const today = useMemo(() => getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined), [nowMs]);
  const grid = useMemo(() => getBsMonthGrid(bsYear, bsMonth), [bsYear, bsMonth]);
  const monthHolidays = useMemo(() => getHolidaysForMonth(bsYear, bsMonth), [bsYear, bsMonth]);

  // Default selected cell: today if in this month, otherwise day 1
  const defaultSelectedDay =
    today.bs.year === bsYear && today.bs.month === bsMonth ? today.bs.day : 1;
  const [selectedDay, setSelectedDay] = useState<number>(defaultSelectedDay);

  // Sync selected day if month/year changes externally
  React.useEffect(() => {
    setSelectedDay(today.bs.year === bsYear && today.bs.month === bsMonth ? today.bs.day : 1);
  }, [bsYear, bsMonth, today.bs.year, today.bs.month, today.bs.day]);

  const selectedCell: CalendarCellData =
    grid.days.find((d) => d.bsDay === selectedDay) ?? grid.days[0];
  const selectedHolidays = getHolidaysForDate(
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
      aria-label={`${grid.monthMeta.en} ${bsYear} BS Calendar Grid`}
      className="rounded-xl border border-stone-200 bg-white shadow-xs"
    >
      {/* Top Month Toolbar */}
      <div className="flex flex-col gap-4 border-b border-stone-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-2xl font-semibold text-stone-900">
              {grid.monthMeta.en} {bsYear}
            </h2>
            <span className="font-display text-xl text-stone-600">
              {grid.monthMeta.ne} {toDevanagariDigits(bsYear)}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            {grid.adSpanLabel} · {grid.totalDays} days · {grid.monthMeta.seasonEn}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
                className="h-10 rounded-md border border-stone-200 bg-[#FBF9F5] px-2.5 text-sm font-medium text-stone-800 focus-visible:outline-2 focus-visible:outline-[#9A3412]"
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
                className="h-10 rounded-md border border-stone-200 bg-[#FBF9F5] px-2.5 text-sm font-medium text-stone-800 focus-visible:outline-2 focus-visible:outline-[#9A3412]"
              >
                {BS_MONTHS.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.en} ({m.ne})
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
                  handleLink(e, `/calendar/${grid.prevMonth!.year}/${grid.prevMonth!.slug}`)
                }
                aria-label={`Previous month: ${grid.prevMonth.nameEn} ${grid.prevMonth.year}`}
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
                  handleLink(e, `/calendar/${grid.nextMonth!.year}/${grid.nextMonth!.slug}`)
                }
                aria-label={`Next month: ${grid.nextMonth.nameEn} ${grid.nextMonth.year}`}
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
              aria-label={wd.isHoliday ? `${wd.en} (Weekly Holiday)` : wd.en}
              className={`py-2.5 text-xs font-semibold tracking-wide ${
                wd.isHoliday ? 'text-[#9A3412]' : 'text-stone-600'
              }`}
            >
              <span className="block sm:inline">{wd.shortEn}</span>
              <span className="hidden sm:inline text-stone-400"> · </span>
              <span className="block sm:inline font-normal">{wd.shortNe}</span>
            </div>
          ))}
        </div>

        {/* Day Cells Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-stone-100 border-b border-stone-200">
          {Array.from({ length: grid.startWeekday }).map((_, idx) => (
            <div
              key={`empty-start-${idx}`}
              aria-hidden="true"
              className="min-h-[68px] bg-stone-50/60 sm:min-h-[88px]"
            />
          ))}

          {grid.days.map((cell) => {
            const holidaysOnDay = getHolidaysForDate(cell.bsYear, cell.bsMonth, cell.bsDay);
            const hasPublicHoliday = holidaysOnDay.some((h) => h.isPublicHoliday);
            const isToday =
              today.bs.year === cell.bsYear &&
              today.bs.month === cell.bsMonth &&
              today.bs.day === cell.bsDay;
            const isSelected = selectedDay === cell.bsDay;
            const isRedDay = cell.isSaturday || hasPublicHoliday;

            const holidayNames = holidaysOnDay.map((h) => h.nameEn).join(', ');
            const cellAriaLabel = [
              `${grid.monthMeta.en} ${cell.bsDay}, ${cell.bsYear} BS`,
              `${cell.adMonthShort} ${cell.adDay}, ${cell.adYear}`,
              WEEKDAYS[cell.weekday].en,
              isToday ? 'Today' : '',
              holidayNames ? `Holiday: ${holidayNames}` : '',
            ]
              .filter(Boolean)
              .join(', ');

            return (
              <button
                key={cell.bsDay}
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                aria-label={cellAriaLabel}
                onClick={() => setSelectedDay(cell.bsDay)}
                className={`group relative flex min-h-[68px] flex-col justify-between p-1.5 text-left transition-colors duration-150 sm:min-h-[92px] sm:p-2.5 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[#9A3412] ${
                  isToday
                    ? 'bg-[#9A3412]/10 ring-1 ring-inset ring-[#9A3412]'
                    : isSelected
                      ? 'bg-[#F3EFE6] ring-1 ring-inset ring-stone-400'
                      : cell.isSaturday
                        ? 'bg-stone-50/70 hover:bg-[#F3EFE6]/60'
                        : 'bg-white hover:bg-[#FBF9F5]'
                }`}
              >
                <div className="flex w-full items-start justify-between gap-1">
                  <span
                    className={`font-mono text-base font-semibold leading-none tabular-nums sm:text-xl ${
                      isToday || isRedDay ? 'text-[#9A3412]' : 'text-stone-900'
                    }`}
                  >
                    {cell.bsDay}
                  </span>
                  <span className="text-[11px] font-medium leading-none text-stone-400 tabular-nums sm:text-xs">
                    {cell.bsDayNe}
                  </span>
                </div>

                {/* Holiday / Today text label (never color-only!) */}
                <div className="mt-1 flex w-full flex-col gap-0.5">
                  {isToday && (
                    <span className="truncate text-[10px] font-semibold tracking-wide text-[#9A3412]">
                      Today
                    </span>
                  )}
                  {holidaysOnDay.length > 0 && (
                    <>
                      <span
                        className={`sm:hidden text-[10px] leading-tight ${
                          hasPublicHoliday ? 'font-semibold text-[#9A3412]' : 'text-stone-600'
                        }`}
                      >
                        {hasPublicHoliday ? 'Holiday' : 'Event'}
                      </span>
                      <span
                        className={`hidden sm:block truncate text-[11px] leading-tight ${
                          hasPublicHoliday ? 'font-medium text-[#9A3412]' : 'text-stone-600'
                        }`}
                        title={holidayNames}
                      >
                        {holidaysOnDay[0].nameEn}
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-auto flex w-full items-center justify-end pt-1">
                  <span className="font-mono text-[10px] text-stone-500 tabular-nums sm:text-[11px]">
                    {cell.adDay === 1 || cell.bsDay === 1
                      ? `${cell.adMonthShort} ${cell.adDay}`
                      : cell.adDay}
                  </span>
                </div>
              </button>
            );
          })}

          {Array.from({ length: trailingCount }).map((_, idx) => (
            <div
              key={`empty-end-${idx}`}
              aria-hidden="true"
              className="min-h-[68px] bg-stone-50/60 sm:min-h-[88px]"
            />
          ))}
        </div>
      </div>

      {/* Selected Day Detail Bar */}
      <div
        aria-live="polite"
        className="flex flex-col gap-3 bg-[#FBF9F5] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div className="flex items-start gap-3">
          <CalendarIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#9A3412]" aria-hidden="true" />
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

        <div className="text-xs text-stone-600">
          {selectedHolidays.length > 0 ? (
            <div className="space-y-1">
              {selectedHolidays.map((h) => (
                <p key={h.id} className="font-medium text-[#9A3412]">
                  {h.nameEn} ({h.nameNe}) · {h.type === 'women_only'
                    ? 'Women-only Holiday'
                    : h.isPublicHoliday
                      ? 'Public Holiday'
                      : 'Observance'}
                </p>
              ))}
            </div>
          ) : selectedCell.isSaturday ? (
            <p className="font-medium text-[#9A3412]">Weekly Holiday (Saturday / शनिबार)</p>
          ) : (
            <p className="text-stone-500">Regular working day in Nepal</p>
          )}
        </div>
      </div>

      {/* Month Holidays Summary Strip */}
      {monthHolidays.length > 0 && (
        <div className="border-t border-stone-200 px-4 py-4 sm:px-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            Holidays &amp; Observances in {grid.monthMeta.en} {bsYear}
          </h3>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {monthHolidays.map((h) => (
              <li
                key={h.id}
                className="flex items-baseline justify-between gap-3 border-b border-stone-100 pb-2 text-sm last:border-b-0"
              >
                <span className="text-stone-800">
                  <strong className="font-mono font-semibold tabular-nums text-[#9A3412]">
                    {grid.monthMeta.en.slice(0, 3)} {h.bsDay}
                  </strong>
                  {' · '}
                  {h.nameEn}
                  {h.isPublicHoliday ? (
                    <span className="text-xs text-[#9A3412]"> (Public Holiday)</span>
                  ) : (
                    <span className="text-xs text-stone-500"> (Observance)</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-stone-500">{h.nameNe}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
