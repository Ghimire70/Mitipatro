import React, { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { bsToAd, getBsMonthGrid, getTodayNepal, toDevanagariDigits } from '../../lib/bsConverter';
import { WEEKDAYS } from '../../lib/bsData';
import { getHolidaysForMonth } from '../../lib/holidays';
import type { FaqItem } from '../../lib/seo';
import { CalendarGrid } from '../components/CalendarGrid';
import { AdSlot } from '../components/AdSlot';
import { FaqSection } from '../components/FaqSection';
import { useLocale } from '../../contexts/LocaleContext';
import { HolidayReferenceNote } from '../components/HolidayReferenceNote';
import { EditorialHero } from '../components/EditorialHero';
import { HolidaysDrawer } from '../components/HolidaysDrawer';
import { ToastBanner } from '../components/ToastBanner';
import { QuickConverterPanel } from '../components/QuickConverterPanel';

interface MonthPageProps {
  year: number;
  month: number; // 1–12
  faqs: FaqItem[];
  nowMs?: number;
  onNavigate: (path: string) => void;
  rashifalIndexingEnabled?: boolean;
}

export const MonthPage: React.FC<MonthPageProps> = ({
  year,
  month,
  faqs,
  nowMs,
  onNavigate,
  rashifalIndexingEnabled = false,
}) => {
  const { locale, t } = useLocale();
  const grid = useMemo(() => getBsMonthGrid(year, month), [year, month]);
  const firstAd = useMemo(() => bsToAd(year, month, 1), [year, month]);
  const lastAd = useMemo(() => bsToAd(year, month, grid.totalDays), [year, month, grid.totalDays]);
  const holidays = useMemo(() => getHolidaysForMonth(year, month), [year, month]);
  const publicCount = holidays.filter((h) => h.isPublicHoliday).length;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  const handleJumpToToday = () => {
    const t = getTodayNepal(nowMs !== undefined ? new Date(nowMs) : undefined);
    if (t.bs.year === year && t.bs.month === month) {
      setToastMessage(locale === 'ne' ? 'पहिले नै आजको मिति हेर्दै हुनुहुन्छ' : 'Already viewing today');
    } else {
      onNavigate(`/calendar/${t.bs.year}/${t.bs.monthSlug}`);
      setToastMessage(locale === 'ne'
        ? `${t.bs.monthNameNe} ${toDevanagariDigits(t.bs.day)}, ${toDevanagariDigits(t.bs.year)} वि.सं.मा जानुभयो`
        : `Jumped to ${t.bs.monthNameEn} ${t.bs.day}, ${t.bs.year} BS`);
    }
  };

  const handleSelectDate = (bsYear: number, bsMonth: number, bsDay: number) => {
    const monthMeta = getBsMonthGrid(bsYear, bsMonth).monthMeta;
    setToastMessage(locale === 'ne'
      ? `${monthMeta.ne} ${toDevanagariDigits(bsDay)}, ${toDevanagariDigits(bsYear)} वि.सं. छानियो`
      : `Selected ${bsDay} ${monthMeta.en}, ${bsYear} BS`);
  };

  const handleCloseDrawer = () => setDrawerOpen(false);
  const handleOpenDrawer = () => setDrawerOpen(true);
  const handleCloseToast = () => setToastMessage('');

  const BS_MONTH_NAMES = [
    'Baisakh', 'Jestha', 'Ashad', 'Shrawan', 'Bhadra', 'Ashwin',
    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
  ];

  return (
    <div className="print-month-page mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <ToastBanner
        message={toastMessage}
        visible={toastMessage.length > 0}
        onClose={handleCloseToast}
      />

      <nav aria-label="Breadcrumb" className="print-hidden text-xs text-stone-500">
        <a href="/" onClick={(e) => handleLink(e, '/')} className="hover:text-[#9A3412] hover:underline">
          {t('routes.home')}
        </a>
        <span className="mx-2">/</span>
        <a
          href={`/calendar/${year}`}
          onClick={(e) => handleLink(e, `/calendar/${year}`)}
          className="hover:text-[#9A3412] hover:underline"
        >
          {t('navigation.calendar')} {year}
        </a>
        <span className="mx-2">/</span>
        <span className="text-stone-800">
          {grid.monthMeta.en} {year}
        </span>
      </nav>

      {/* Editorial Hero */}
      <EditorialHero
        bsYear={year}
        bsMonth={month}
        nowMs={nowMs}
        onJumpToToday={handleJumpToToday}
        onOpenHolidays={handleOpenDrawer}
        onNavigate={onNavigate}
        monthSlug={grid.monthMeta.slug}
        rashifalIndexingEnabled={rashifalIndexingEnabled}
      />

      <div className="print-hidden mt-6">
        <AdSlot variant="leaderboard" />
      </div>

      {/* Print button — direct text for test compatibility */}
      <button
        type="button"
        aria-label={`Print ${grid.monthMeta.en} ${year} BS calendar`}
        onClick={() => window.print()}
        className="print-hidden inline-flex min-h-[44px] items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
      >
        <Printer className="h-4 w-4" aria-hidden="true" />
        Print calendar
      </button>

      {/* Two-column workspace: calendar + converter panel */}
      <div className="print-month-layout mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Calendar (8 cols) */}
        <div className="print-calendar-container lg:col-span-8">
          <div className="print-calendar">
            <CalendarGrid
              bsYear={year}
              bsMonth={month}
              nowMs={nowMs}
              onNavigate={onNavigate}
              rashifalIndexingEnabled={rashifalIndexingEnabled}
            />
          </div>
        </div>

        {/* Right: Quick Converter Panel (4 cols) */}
        <aside className="print-hidden lg:col-span-4">
          <QuickConverterPanel nowMs={nowMs} onNavigate={onNavigate} />
        </aside>
      </div>

      <div className="print-hidden">
        <FaqSection faqs={faqs} />
      </div>

      {/* Holidays Drawer (slide-over) */}
      <HolidaysDrawer
        bsYear={year}
        bsMonth={month}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onSelectDate={handleSelectDate}
      />
    </div>
  );
};
